"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERTH_TZ = void 0;
exports.applyRounding = applyRounding;
exports.calculateBreakMinutes = calculateBreakMinutes;
exports.calculateSessionMinutes = calculateSessionMinutes;
exports.splitSessionByDay = splitSessionByDay;
exports.toPerthDateString = toPerthDateString;
exports.perthDateToUtcStart = perthDateToUtcStart;
exports.perthDateToUtcEnd = perthDateToUtcEnd;
exports.calculateDailyTotals = calculateDailyTotals;
exports.formatMinutes = formatMinutes;
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
exports.PERTH_TZ = "Australia/Perth";
/**
 * Round minutes to the nearest interval based on the rounding rule.
 */
function applyRounding(minutes, rule) {
    if (rule === "NONE")
        return minutes;
    const intervals = {
        NEAREST_5: 5,
        NEAREST_10: 10,
        NEAREST_15: 15,
    };
    const interval = intervals[rule];
    if (!interval)
        return minutes;
    return Math.round(minutes / interval) * interval;
}
/**
 * Calculate total break duration in minutes.
 */
function calculateBreakMinutes(breaks) {
    return breaks.reduce((total, brk) => {
        const mins = (0, date_fns_1.differenceInMinutes)(brk.endedAt, brk.startedAt);
        return total + Math.max(0, mins);
    }, 0);
}
/**
 * Calculate worked minutes for a session (gross duration minus breaks).
 */
function calculateSessionMinutes(session) {
    if (!session.endedAt)
        return 0;
    const grossMinutes = (0, date_fns_1.differenceInMinutes)(session.endedAt, session.startedAt);
    if (grossMinutes <= 0)
        return 0;
    const breakMinutes = calculateBreakMinutes(session.breaks ?? []);
    return Math.max(0, grossMinutes - breakMinutes);
}
/**
 * Split a session that may span midnight into per-day chunks.
 * Returns array of { date: 'YYYY-MM-DD', minutes: number } in Perth timezone.
 */
function splitSessionByDay(session) {
    const results = [];
    const startPerth = (0, date_fns_tz_1.toZonedTime)(session.startedAt, exports.PERTH_TZ);
    const endPerth = (0, date_fns_tz_1.toZonedTime)(session.endedAt, exports.PERTH_TZ);
    let cursor = (0, date_fns_1.startOfDay)(startPerth);
    while (cursor <= (0, date_fns_1.startOfDay)(endPerth)) {
        const dayStart = cursor;
        // Use start-of-next-day as the exclusive upper bound to avoid
        // off-by-one from endOfDay returning 23:59:59.999
        const dayEndExclusive = (0, date_fns_1.addDays)(cursor, 1);
        const segStart = startPerth > dayStart ? startPerth : dayStart;
        const segEnd = endPerth < dayEndExclusive ? endPerth : dayEndExclusive;
        const mins = (0, date_fns_1.differenceInMinutes)(segEnd, segStart);
        if (mins > 0) {
            results.push({
                date: (0, date_fns_1.format)(cursor, "yyyy-MM-dd"),
                minutes: mins,
            });
        }
        cursor = (0, date_fns_1.addDays)(cursor, 1);
    }
    return results;
}
/**
 * Get date string in YYYY-MM-DD format for a UTC date in Perth timezone.
 */
function toPerthDateString(date) {
    const perth = (0, date_fns_tz_1.toZonedTime)(date, exports.PERTH_TZ);
    return (0, date_fns_1.format)(perth, "yyyy-MM-dd");
}
/**
 * Convert a YYYY-MM-DD date string + time to UTC Date, interpreting date as Perth local.
 */
function perthDateToUtcStart(dateStr) {
    return (0, date_fns_tz_1.fromZonedTime)(`${dateStr}T00:00:00`, exports.PERTH_TZ);
}
function perthDateToUtcEnd(dateStr) {
    return (0, date_fns_tz_1.fromZonedTime)(`${dateStr}T23:59:59.999`, exports.PERTH_TZ);
}
/**
 * Calculate daily TOIL totals for a set of sessions.
 */
function calculateDailyTotals(sessions, settings) {
    const rule = settings.roundingRule;
    // Map of date -> accumulated data
    const dailyMap = new Map();
    for (const session of sessions) {
        if (!session.endedAt)
            continue;
        const sessionMinutes = calculateSessionMinutes({
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            breaks: session.breaks,
        });
        const chunks = splitSessionByDay({
            startedAt: session.startedAt,
            endedAt: session.endedAt,
        });
        // For multi-day sessions, distribute session contribution proportionally
        const totalChunkMinutes = chunks.reduce((s, c) => s + c.minutes, 0);
        for (const chunk of chunks) {
            const proportion = totalChunkMinutes > 0 ? chunk.minutes / totalChunkMinutes : 0;
            const contributedMinutes = Math.round(sessionMinutes * proportion);
            if (!dailyMap.has(chunk.date)) {
                dailyMap.set(chunk.date, { totalMinutes: 0, sessions: [] });
            }
            const day = dailyMap.get(chunk.date);
            day.totalMinutes += contributedMinutes;
            // Only add session entry once, on its primary (start) date
            const sessionStartDate = toPerthDateString(session.startedAt);
            if (chunk.date === sessionStartDate) {
                day.sessions.push({
                    id: session.id,
                    startedAt: session.startedAt,
                    endedAt: session.endedAt,
                    minutes: sessionMinutes,
                });
            }
        }
    }
    // Sort dates and compute TIL
    const sortedDates = Array.from(dailyMap.keys()).sort();
    return sortedDates.map((date) => {
        const day = dailyMap.get(date);
        const roundedMinutes = applyRounding(day.totalMinutes, rule);
        const rawTil = roundedMinutes - settings.standardDailyMinutes;
        const tilMinutes = settings.allowNegativeTil
            ? rawTil
            : Math.max(0, rawTil);
        return {
            date,
            totalMinutes: roundedMinutes,
            tilMinutes,
            sessions: day.sessions,
        };
    });
}
/**
 * Format minutes as h:mm string.
 */
function formatMinutes(minutes) {
    const sign = minutes < 0 ? "-" : "";
    const abs = Math.abs(minutes);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `${sign}${h}:${m.toString().padStart(2, "0")}`;
}
//# sourceMappingURL=til.js.map