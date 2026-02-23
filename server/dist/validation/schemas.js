"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSettingsSchema = exports.ReportQuerySchema = exports.DateRangeQuerySchema = exports.UpdateSessionSchema = exports.CreateSessionSchema = exports.BreakSchema = exports.ClockOutSchema = exports.ClockInSchema = void 0;
const zod_1 = require("zod");
exports.ClockInSchema = zod_1.z.object({
    startedAt: zod_1.z.string().datetime({ offset: true }).optional(),
    locationLabel: zod_1.z.string().max(255).optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    notes: zod_1.z.string().max(2000).optional(),
    idempotencyKey: zod_1.z.string().max(128).optional(),
});
exports.ClockOutSchema = zod_1.z.object({
    endedAt: zod_1.z.string().datetime({ offset: true }).optional(),
    idempotencyKey: zod_1.z.string().max(128).optional(),
});
exports.BreakSchema = zod_1.z.object({
    startedAt: zod_1.z.string().datetime({ offset: true }),
    endedAt: zod_1.z.string().datetime({ offset: true }),
});
exports.CreateSessionSchema = zod_1.z.object({
    startedAt: zod_1.z.string().datetime({ offset: true }),
    endedAt: zod_1.z.string().datetime({ offset: true }).optional(),
    locationLabel: zod_1.z.string().max(255).optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    notes: zod_1.z.string().max(2000).optional(),
    breaks: zod_1.z.array(exports.BreakSchema).optional(),
});
exports.UpdateSessionSchema = zod_1.z.object({
    startedAt: zod_1.z.string().datetime({ offset: true }).optional(),
    endedAt: zod_1.z.string().datetime({ offset: true }).optional().nullable(),
    locationLabel: zod_1.z.string().max(255).optional().nullable(),
    latitude: zod_1.z.number().min(-90).max(90).optional().nullable(),
    longitude: zod_1.z.number().min(-180).max(180).optional().nullable(),
    notes: zod_1.z.string().max(2000).optional().nullable(),
    breaks: zod_1.z.array(exports.BreakSchema).optional(),
});
exports.DateRangeQuerySchema = zod_1.z.object({
    from: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
        .optional(),
    to: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
        .optional(),
});
exports.ReportQuerySchema = zod_1.z.object({
    from: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
        .optional(),
    to: zod_1.z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
        .optional(),
    format: zod_1.z.enum(["html", "text", "csv"]).default("text"),
});
exports.UpdateSettingsSchema = zod_1.z.object({
    standardDailyMinutes: zod_1.z.number().int().min(1).max(1440).optional(),
    roundingRule: zod_1.z
        .enum(["NONE", "NEAREST_5", "NEAREST_10", "NEAREST_15"])
        .optional(),
    overtimeStartsAfterMinutes: zod_1.z.number().int().min(0).optional().nullable(),
    allowNegativeTil: zod_1.z.boolean().optional(),
    workLocationGeofenceName: zod_1.z.string().max(255).optional().nullable(),
    reportRecipientEmails: zod_1.z.array(zod_1.z.string().email()).optional(),
    reportSubjectTemplate: zod_1.z.string().max(500).optional(),
    reportFooter: zod_1.z.string().max(2000).optional(),
});
//# sourceMappingURL=schemas.js.map