"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const til_1 = require("../lib/til");
const schemas_1 = require("../validation/schemas");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const router = (0, express_1.Router)();
function formatTime(date) {
    const perth = (0, date_fns_tz_1.toZonedTime)(date, til_1.PERTH_TZ);
    return (0, date_fns_1.format)(perth, "HH:mm");
}
function generateTextReport(fromDate, toDate, days, totalWorkedMinutes, totalTilMinutes, footer) {
    const lines = [
        "TOIL TRACKER REPORT",
        "===================",
        `Period: ${fromDate} to ${toDate}`,
        "",
        "Daily Breakdown:",
        "-----------------",
    ];
    for (const day of days) {
        lines.push(`${day.date}  Worked: ${(0, til_1.formatMinutes)(day.totalMinutes).padEnd(6)}  TOIL: ${(0, til_1.formatMinutes)(day.tilMinutes)}`);
        for (const s of day.sessions) {
            const start = formatTime(s.startedAt);
            const end = s.endedAt ? formatTime(s.endedAt) : "ongoing";
            lines.push(`  ${start} - ${end}  (${(0, til_1.formatMinutes)(s.minutes)})`);
        }
    }
    lines.push("");
    lines.push("Summary:");
    lines.push("--------");
    lines.push(`Total Worked: ${(0, til_1.formatMinutes)(totalWorkedMinutes)}`);
    lines.push(`Total TOIL:   ${(0, til_1.formatMinutes)(totalTilMinutes)}`);
    if (footer) {
        lines.push("");
        lines.push(footer);
    }
    return lines.join("\n");
}
function generateHtmlReport(fromDate, toDate, days, totalWorkedMinutes, totalTilMinutes, footer) {
    const rows = days
        .map((day) => {
        const sessionRows = day.sessions
            .map((s) => {
            const start = formatTime(s.startedAt);
            const end = s.endedAt ? formatTime(s.endedAt) : "ongoing";
            return `<tr class="session-row"><td></td><td>${start} – ${end}</td><td>${(0, til_1.formatMinutes)(s.minutes)}</td><td></td></tr>`;
        })
            .join("\n");
        return `
      <tr class="day-row">
        <td><strong>${day.date}</strong></td>
        <td></td>
        <td>${(0, til_1.formatMinutes)(day.totalMinutes)}</td>
        <td>${(0, til_1.formatMinutes)(day.tilMinutes)}</td>
      </tr>
      ${sessionRows}`;
    })
        .join("\n");
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TOIL Report ${fromDate} to ${toDate}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
    h1 { color: #1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 10px; }
    .period { color: #666; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #1a1a2e; color: white; padding: 10px; text-align: left; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    .day-row { background: #f8f9fa; font-weight: 500; }
    .session-row td { font-size: 0.9em; color: #555; padding-left: 30px; }
    .summary { background: #f0f4ff; border-radius: 8px; padding: 20px; }
    .summary-item { display: flex; justify-content: space-between; margin: 8px 0; }
    .summary-item strong { color: #1a1a2e; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 0.85em; }
  </style>
</head>
<body>
  <h1>TOIL Tracker Report</h1>
  <p class="period">Period: <strong>${fromDate}</strong> to <strong>${toDate}</strong></p>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Sessions</th>
        <th>Hours Worked</th>
        <th>TOIL</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-item"><span>Total Hours Worked</span><strong>${(0, til_1.formatMinutes)(totalWorkedMinutes)}</strong></div>
    <div class="summary-item"><span>Total TOIL Accrued</span><strong>${(0, til_1.formatMinutes)(totalTilMinutes)}</strong></div>
  </div>

  ${footer ? `<footer>${footer}</footer>` : ""}
</body>
</html>`;
}
function generateCsvReport(fromDate, toDate, days) {
    const lines = [
        `"TOIL Tracker Report","${fromDate} to ${toDate}"`,
        "",
        '"Date","Session Start","Session End","Session Minutes","Day Total Minutes","Day TOIL Minutes"',
    ];
    for (const day of days) {
        if (day.sessions.length === 0) {
            lines.push(`"${day.date}","","","","${day.totalMinutes}","${day.tilMinutes}"`);
        }
        else {
            day.sessions.forEach((s, i) => {
                const start = formatTime(s.startedAt);
                const end = s.endedAt ? formatTime(s.endedAt) : "ongoing";
                lines.push(`"${i === 0 ? day.date : ""}","${start}","${end}","${s.minutes}","${i === 0 ? day.totalMinutes : ""}","${i === 0 ? day.tilMinutes : ""}"`);
            });
        }
    }
    return lines.join("\n");
}
// GET /api/report?from=YYYY-MM-DD&to=YYYY-MM-DD&format=html|text|csv
router.get("/", async (req, res, next) => {
    try {
        const query = schemas_1.ReportQuerySchema.parse(req.query);
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
        if (query.format === "html") {
            const html = generateHtmlReport(fromDate, toDate, days, totalWorkedMinutes, totalTilMinutes, settings.reportFooter);
            res.setHeader("Content-Type", "text/html");
            res.setHeader("Content-Disposition", `inline; filename="toil-report-${fromDate}-${toDate}.html"`);
            res.send(html);
        }
        else if (query.format === "csv") {
            const csv = generateCsvReport(fromDate, toDate, days);
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename="toil-report-${fromDate}-${toDate}.csv"`);
            res.send(csv);
        }
        else {
            const text = generateTextReport(fromDate, toDate, days, totalWorkedMinutes, totalTilMinutes, settings.reportFooter);
            res.setHeader("Content-Type", "text/plain");
            res.setHeader("Content-Disposition", `inline; filename="toil-report-${fromDate}-${toDate}.txt"`);
            res.send(text);
        }
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=report.js.map