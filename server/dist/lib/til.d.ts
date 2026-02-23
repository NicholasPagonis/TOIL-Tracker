export declare const PERTH_TZ = "Australia/Perth";
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
export declare function applyRounding(minutes: number, rule: RoundingRule): number;
/**
 * Calculate total break duration in minutes.
 */
export declare function calculateBreakMinutes(breaks: BreakInput[]): number;
/**
 * Calculate worked minutes for a session (gross duration minus breaks).
 */
export declare function calculateSessionMinutes(session: SessionInput): number;
/**
 * Split a session that may span midnight into per-day chunks.
 * Returns array of { date: 'YYYY-MM-DD', minutes: number } in Perth timezone.
 */
export declare function splitSessionByDay(session: {
    startedAt: Date;
    endedAt: Date;
}): {
    date: string;
    minutes: number;
}[];
/**
 * Get date string in YYYY-MM-DD format for a UTC date in Perth timezone.
 */
export declare function toPerthDateString(date: Date): string;
/**
 * Convert a YYYY-MM-DD date string + time to UTC Date, interpreting date as Perth local.
 */
export declare function perthDateToUtcStart(dateStr: string): Date;
export declare function perthDateToUtcEnd(dateStr: string): Date;
/**
 * Calculate daily TOIL totals for a set of sessions.
 */
export declare function calculateDailyTotals(sessions: SessionWithBreaks[], settings: SettingsInput): DailyTotal[];
/**
 * Format minutes as h:mm string.
 */
export declare function formatMinutes(minutes: number): string;
//# sourceMappingURL=til.d.ts.map