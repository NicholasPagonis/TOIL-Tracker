import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import {
  calculateDailyTotals,
  perthDateToUtcStart,
  perthDateToUtcEnd,
} from "../lib/til";
import { DateRangeQuerySchema } from "../validation/schemas";
import { format, subDays } from "date-fns";

const router = Router();

// GET /api/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = DateRangeQuerySchema.parse(req.query);

    const today = new Date();
    const toDate =
      query.to ?? format(today, "yyyy-MM-dd");
    const fromDate =
      query.from ?? format(subDays(today, 13), "yyyy-MM-dd");

    const sessions = await prisma.session.findMany({
      where: {
        startedAt: {
          gte: perthDateToUtcStart(fromDate),
          lte: perthDateToUtcEnd(toDate),
        },
      },
      include: { breaks: true },
      orderBy: { startedAt: "asc" },
    });

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    const days = calculateDailyTotals(sessions, settings);

    const totalTilMinutes = days.reduce((sum, d) => sum + d.tilMinutes, 0);
    const totalWorkedMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);

    res.json({
      from: fromDate,
      to: toDate,
      days,
      totalTilMinutes,
      totalWorkedMinutes,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
