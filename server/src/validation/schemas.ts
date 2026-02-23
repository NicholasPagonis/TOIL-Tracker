import { z } from "zod";

export const ClockInSchema = z.object({
  startedAt: z.string().datetime({ offset: true }).optional(),
  locationLabel: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(2000).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export const ClockOutSchema = z.object({
  endedAt: z.string().datetime({ offset: true }).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export const BreakSchema = z.object({
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }),
});

export const CreateSessionSchema = z.object({
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }).optional(),
  locationLabel: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().max(2000).optional(),
  breaks: z.array(BreakSchema).optional(),
});

export const UpdateSessionSchema = z.object({
  startedAt: z.string().datetime({ offset: true }).optional(),
  endedAt: z.string().datetime({ offset: true }).optional().nullable(),
  locationLabel: z.string().max(255).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  breaks: z.array(BreakSchema).optional(),
});

export const DateRangeQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional(),
});

export const ReportQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
    .optional(),
  format: z.enum(["html", "text", "csv"]).default("text"),
});

export const UpdateSettingsSchema = z.object({
  standardDailyMinutes: z.number().int().min(1).max(1440).optional(),
  roundingRule: z
    .enum(["NONE", "NEAREST_5", "NEAREST_10", "NEAREST_15"])
    .optional(),
  overtimeStartsAfterMinutes: z.number().int().min(0).optional().nullable(),
  allowNegativeTil: z.boolean().optional(),
  workLocationGeofenceName: z.string().max(255).optional().nullable(),
  reportRecipientEmails: z.array(z.string().email()).optional(),
  reportSubjectTemplate: z.string().max(500).optional(),
  reportFooter: z.string().max(2000).optional(),
});

export const UpdateDbConfigSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("sqlite"),
    file: z.string().max(500).optional(),
  }),
  z.object({
    provider: z.literal("mysql"),
    host: z.string().min(1).max(253),
    port: z.number().int().min(1).max(65535).optional(),
    database: z.string().min(1).max(255),
    user: z.string().min(1).max(255),
    password: z.string().max(1024).optional(),
  }),
]);

export type ClockInInput = z.infer<typeof ClockInSchema>;
export type ClockOutInput = z.infer<typeof ClockOutSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
export type UpdateDbConfigInput = z.infer<typeof UpdateDbConfigSchema>;
