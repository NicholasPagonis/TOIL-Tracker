import {
  format,
  differenceInMinutes,
  addDays,
  startOfDay,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const PERTH_TZ = "Australia/Perth";

export type RoundingRule = "NONE" | "NEAREST_5" | "NEAREST_10" | "NEAREST_15";

export interface BreakInput {
  startedAt: Date;
  endedAt: Date;
}

export interface SessionInput {
  startedAt: Date;
  endedAt: Date | null;
  breaks?: BreakInput[];
}

export interface SessionWithBreaks {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  source: string;
  locationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  breaks: BreakInput[];
}

export interface SettingsInput {
  standardDailyMinutes: number;
  roundingRule: string;
  allowNegativeTil: boolean;
  overtimeStartsAfterMinutes: number | null;
}

export interface DailyTotal {
  date: string;
  totalMinutes: number;
  tilMinutes: number;
  sessions: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    minutes: number;
  }[];
}

/**
 * Round minutes to the nearest interval based on the rounding rule.
 */
export function applyRounding(minutes: number, rule: RoundingRule): number {
  if (rule === "NONE") return minutes;

  const intervals: Record<Exclude<RoundingRule, "NONE">, number> = {
    NEAREST_5: 5,
    NEAREST_10: 10,
    NEAREST_15: 15,
  };

  const interval = intervals[rule as Exclude<RoundingRule, "NONE">];
  if (!interval) return minutes;

  return Math.round(minutes / interval) * interval;
}

/**
 * Calculate total break duration in minutes.
 */
export function calculateBreakMinutes(breaks: BreakInput[]): number {
  return breaks.reduce((total, brk) => {
    const mins = differenceInMinutes(brk.endedAt, brk.startedAt);
    return total + Math.max(0, mins);
  }, 0);
}

/**
 * Calculate worked minutes for a session (gross duration minus breaks).
 */
export function calculateSessionMinutes(session: SessionInput): number {
  if (!session.endedAt) return 0;

  const grossMinutes = differenceInMinutes(session.endedAt, session.startedAt);
  if (grossMinutes <= 0) return 0;

  const breakMinutes = calculateBreakMinutes(session.breaks ?? []);
  return Math.max(0, grossMinutes - breakMinutes);
}

/**
 * Split a session that may span midnight into per-day chunks.
 * Returns array of { date: 'YYYY-MM-DD', minutes: number } in Perth timezone.
 */
export function splitSessionByDay(session: {
  startedAt: Date;
  endedAt: Date;
}): { date: string; minutes: number }[] {
  const results: { date: string; minutes: number }[] = [];

  const startPerth = toZonedTime(session.startedAt, PERTH_TZ);
  const endPerth = toZonedTime(session.endedAt, PERTH_TZ);

  let cursor = startOfDay(startPerth);

  while (cursor <= startOfDay(endPerth)) {
    const dayStart = cursor;
    // Use start-of-next-day as the exclusive upper bound to avoid
    // off-by-one from endOfDay returning 23:59:59.999
    const dayEndExclusive = addDays(cursor, 1);

    const segStart = startPerth > dayStart ? startPerth : dayStart;
    const segEnd = endPerth < dayEndExclusive ? endPerth : dayEndExclusive;

    const mins = differenceInMinutes(segEnd, segStart);
    if (mins > 0) {
      results.push({
        date: format(cursor, "yyyy-MM-dd"),
        minutes: mins,
      });
    }

    cursor = addDays(cursor, 1);
  }

  return results;
}

/**
 * Get date string in YYYY-MM-DD format for a UTC date in Perth timezone.
 */
export function toPerthDateString(date: Date): string {
  const perth = toZonedTime(date, PERTH_TZ);
  return format(perth, "yyyy-MM-dd");
}

/**
 * Convert a YYYY-MM-DD date string + time to UTC Date, interpreting date as Perth local.
 */
export function perthDateToUtcStart(dateStr: string): Date {
  return fromZonedTime(`${dateStr}T00:00:00`, PERTH_TZ);
}

export function perthDateToUtcEnd(dateStr: string): Date {
  return fromZonedTime(`${dateStr}T23:59:59.999`, PERTH_TZ);
}

/**
 * Calculate daily TOIL totals for a set of sessions.
 */
export function calculateDailyTotals(
  sessions: SessionWithBreaks[],
  settings: SettingsInput
): DailyTotal[] {
  const rule = settings.roundingRule as RoundingRule;

  // Map of date -> accumulated data
  const dailyMap = new Map<
    string,
    {
      totalMinutes: number;
      sessions: { id: string; startedAt: Date; endedAt: Date | null; minutes: number }[];
    }
  >();

  for (const session of sessions) {
    if (!session.endedAt) continue;

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
      const proportion =
        totalChunkMinutes > 0 ? chunk.minutes / totalChunkMinutes : 0;
      const contributedMinutes = Math.round(sessionMinutes * proportion);

      if (!dailyMap.has(chunk.date)) {
        dailyMap.set(chunk.date, { totalMinutes: 0, sessions: [] });
      }

      const day = dailyMap.get(chunk.date)!;
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
    const day = dailyMap.get(date)!;
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
export function formatMinutes(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${m.toString().padStart(2, "0")}`;
}
