import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { calculateSessionMinutes } from "../lib/til";
import {
  ClockInSchema,
  ClockOutSchema,
  CreateSessionSchema,
  UpdateSessionSchema,
  DateRangeQuerySchema,
} from "../validation/schemas";
import { createError } from "../middleware/error";
import { perthDateToUtcStart, perthDateToUtcEnd } from "../lib/til";

const router = Router();

// POST /api/sessions/clock-in
router.post(
  "/clock-in",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = ClockInSchema.parse(req.body);
      const now = new Date();
      const startedAt = body.startedAt ? new Date(body.startedAt) : now;

      // Check for open session within last 8 hours
      const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
      const openSession = await prisma.session.findFirst({
        where: {
          endedAt: null,
          startedAt: { gte: eightHoursAgo },
        },
        include: { breaks: true },
        orderBy: { startedAt: "desc" },
      });

      if (openSession) {
        res.status(200).json({ alreadyClockedIn: true, session: openSession });
        return;
      }

      const source =
        req.headers["x-api-key"] && process.env.API_KEY
          ? "SHORTCUT"
          : "MANUAL";

      const session = await prisma.session.create({
        data: {
          startedAt,
          source,
          locationLabel: body.locationLabel ?? null,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          notes: body.notes ?? null,
        },
        include: { breaks: true },
      });

      await prisma.auditLog.create({
        data: {
          eventType: "CLOCK_IN",
          payload: JSON.stringify({
            sessionId: session.id,
            startedAt: session.startedAt,
            source,
            idempotencyKey: body.idempotencyKey,
          }),
        },
      });

      res.status(201).json({ alreadyClockedIn: false, session });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/sessions/clock-out
router.post(
  "/clock-out",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = ClockOutSchema.parse(req.body);
      const now = new Date();
      const endedAt = body.endedAt ? new Date(body.endedAt) : now;

      const openSession = await prisma.session.findFirst({
        where: { endedAt: null },
        orderBy: { startedAt: "desc" },
      });

      if (!openSession) {
        return next(
          createError(
            "No open session found. Please clock in before clocking out.",
            409
          )
        );
      }

      const session = await prisma.session.update({
        where: { id: openSession.id },
        data: { endedAt },
        include: { breaks: true },
      });

      await prisma.auditLog.create({
        data: {
          eventType: "CLOCK_OUT",
          payload: JSON.stringify({
            sessionId: session.id,
            endedAt: session.endedAt,
            idempotencyKey: body.idempotencyKey,
          }),
        },
      });

      res.json({ session });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/sessions?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = DateRangeQuerySchema.parse(req.query);

    const where: Record<string, unknown> = {};

    if (query.from || query.to) {
      where.startedAt = {};
      if (query.from) {
        (where.startedAt as Record<string, Date>).gte = perthDateToUtcStart(
          query.from
        );
      }
      if (query.to) {
        (where.startedAt as Record<string, Date>).lte = perthDateToUtcEnd(
          query.to
        );
      }
    }

    const sessions = await prisma.session.findMany({
      where,
      include: { breaks: true },
      orderBy: { startedAt: "desc" },
    });

    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions (manual create)
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateSessionSchema.parse(req.body);
    const startedAt = new Date(body.startedAt);
    const endedAt = body.endedAt ? new Date(body.endedAt) : null;

    // Check for overlapping sessions
    const overlapWhere: Record<string, unknown> = {
      OR: [
        // New session starts during an existing session
        {
          startedAt: { lte: startedAt },
          endedAt: { gte: startedAt },
        },
      ],
    };

    if (endedAt) {
      (overlapWhere.OR as unknown[]).push(
        // New session ends during an existing session
        {
          startedAt: { lte: endedAt },
          endedAt: { gte: endedAt },
        },
        // New session completely contains an existing session
        {
          startedAt: { gte: startedAt },
          endedAt: { lte: endedAt },
        }
      );
    }

    const overlapping = await prisma.session.findFirst({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: overlapWhere as any,
    });

    const session = await prisma.session.create({
      data: {
        startedAt,
        endedAt,
        source: "MANUAL",
        locationLabel: body.locationLabel ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        notes: body.notes ?? null,
        breaks: body.breaks
          ? {
              create: body.breaks.map((b) => ({
                startedAt: new Date(b.startedAt),
                endedAt: new Date(b.endedAt),
              })),
            }
          : undefined,
      },
      include: { breaks: true },
    });

    res.status(201).json({
      session,
      ...(overlapping
        ? {
            warning:
              "This session overlaps with an existing session. Please review.",
            overlappingSessionId: overlapping.id,
          }
        : {}),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sessions/:id
router.patch(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params["id"]);
      const body = UpdateSessionSchema.parse(req.body);

      const existing = await prisma.session.findUnique({ where: { id } });
      if (!existing) {
        return next(createError("Session not found", 404));
      }

      const updateData: Record<string, unknown> = { source: "EDITED" };

      if (body.startedAt !== undefined) {
        updateData.startedAt = new Date(body.startedAt);
      }
      if (body.endedAt !== undefined) {
        updateData.endedAt = body.endedAt ? new Date(body.endedAt) : null;
      }
      if (body.locationLabel !== undefined)
        updateData.locationLabel = body.locationLabel;
      if (body.latitude !== undefined) updateData.latitude = body.latitude;
      if (body.longitude !== undefined) updateData.longitude = body.longitude;
      if (body.notes !== undefined) updateData.notes = body.notes;

      // If breaks are provided, replace them all
      if (body.breaks !== undefined) {
        await prisma.break.deleteMany({ where: { sessionId: id } });
        await prisma.break.createMany({
          data: body.breaks.map((b) => ({
            sessionId: id,
            startedAt: new Date(b.startedAt),
            endedAt: new Date(b.endedAt),
          })),
        });
      }

      const session = await prisma.session.update({
        where: { id },
        data: updateData as Parameters<typeof prisma.session.update>[0]["data"],
        include: { breaks: true },
      });

      await prisma.auditLog.create({
        data: {
          eventType: "EDIT_SESSION",
          payload: JSON.stringify({ sessionId: id, changes: body }),
        },
      });

      res.json({ session });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/sessions/:id
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params["id"]);

      const existing = await prisma.session.findUnique({ where: { id } });
      if (!existing) {
        return next(createError("Session not found", 404));
      }

      await prisma.session.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          eventType: "DELETE_SESSION",
          payload: JSON.stringify({
            sessionId: id,
            startedAt: existing.startedAt,
            endedAt: existing.endedAt,
          }),
        },
      });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;

// Re-export for use in summary/report
export { calculateSessionMinutes };
