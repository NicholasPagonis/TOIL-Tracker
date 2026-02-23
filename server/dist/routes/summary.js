"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const til_1 = require("../lib/til");
const schemas_1 = require("../validation/schemas");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
// GET /api/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/", async (req, res, next) => {
    try {
        const query = schemas_1.DateRangeQuerySchema.parse(req.query);
        const today = new Date();
        const toDate = query.to ?? (0, date_fns_1.format)(today, "yyyy-MM-dd");
        const fromDate = query.from ?? (0, date_fns_1.format)((0, date_fns_1.subDays)(today, 13), "yyyy-MM-dd");
        const sessions = await prisma_1.prisma.session.findMany({
            where: {
                startedAt: {
                    gte: (0, til_1.perthDateToUtcStart)(fromDate),
                    lte: (0, til_1.perthDateToUtcEnd)(toDate),
                },
            },
            include: { breaks: true },
            orderBy: { startedAt: "asc" },
        });
        const settings = await prisma_1.prisma.settings.upsert({
            where: { id: "singleton" },
            update: {},
            create: { id: "singleton" },
        });
        const days = (0, til_1.calculateDailyTotals)(sessions, settings);
        const totalTilMinutes = days.reduce((sum, d) => sum + d.tilMinutes, 0);
        const totalWorkedMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
        res.json({
            from: fromDate,
            to: toDate,
            days,
            totalTilMinutes,
            totalWorkedMinutes,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=summary.js.map