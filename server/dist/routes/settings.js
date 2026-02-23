"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
// GET /api/settings
router.get("/", async (_req, res, next) => {
    try {
        const settings = await prisma_1.prisma.settings.upsert({
            where: { id: "singleton" },
            update: {},
            create: { id: "singleton" },
        });
        res.json({
            ...settings,
            reportRecipientEmails: JSON.parse(settings.reportRecipientEmails),
        });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/settings
router.put("/", async (req, res, next) => {
    try {
        const body = schemas_1.UpdateSettingsSchema.parse(req.body);
        const updateData = {};
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
            updateData.reportRecipientEmails = JSON.stringify(body.reportRecipientEmails);
        }
        if (body.reportSubjectTemplate !== undefined) {
            updateData.reportSubjectTemplate = body.reportSubjectTemplate;
        }
        if (body.reportFooter !== undefined) {
            updateData.reportFooter = body.reportFooter;
        }
        const settings = await prisma_1.prisma.settings.upsert({
            where: { id: "singleton" },
            update: updateData,
            create: { id: "singleton", ...updateData },
        });
        res.json({
            ...settings,
            reportRecipientEmails: JSON.parse(settings.reportRecipientEmails),
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map