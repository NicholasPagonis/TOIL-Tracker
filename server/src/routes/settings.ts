import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { UpdateSettingsSchema } from "../validation/schemas";

const router = Router();

// GET /api/settings
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });

    res.json({
      ...settings,
      reportRecipientEmails: JSON.parse(settings.reportRecipientEmails),
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings
router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = UpdateSettingsSchema.parse(req.body);

    const updateData: Record<string, unknown> = {};

    if (body.standardDailyMinutes !== undefined) {
      updateData.standardDailyMinutes = body.standardDailyMinutes;
    }
    if (body.roundingRule !== undefined) {
      updateData.roundingRule = body.roundingRule;
    }
    if (body.overtimeStartsAfterMinutes !== undefined) {
      updateData.overtimeStartsAfterMinutes = body.overtimeStartsAfterMinutes;
    }
    if (body.allowNegativeTil !== undefined) {
      updateData.allowNegativeTil = body.allowNegativeTil;
    }
    if (body.workLocationGeofenceName !== undefined) {
      updateData.workLocationGeofenceName = body.workLocationGeofenceName;
    }
    if (body.reportRecipientEmails !== undefined) {
      updateData.reportRecipientEmails = JSON.stringify(
        body.reportRecipientEmails
      );
    }
    if (body.reportSubjectTemplate !== undefined) {
      updateData.reportSubjectTemplate = body.reportSubjectTemplate;
    }
    if (body.reportFooter !== undefined) {
      updateData.reportFooter = body.reportFooter;
    }

    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: updateData as Parameters<typeof prisma.settings.upsert>[0]["update"],
      create: { id: "singleton", ...updateData } as Parameters<typeof prisma.settings.upsert>[0]["create"],
    });

    res.json({
      ...settings,
      reportRecipientEmails: JSON.parse(settings.reportRecipientEmails),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
