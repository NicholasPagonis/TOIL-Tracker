import { z } from "zod";
export declare const ClockInSchema: z.ZodObject<{
    startedAt: z.ZodOptional<z.ZodString>;
    locationLabel: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startedAt?: string | undefined;
    locationLabel?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    notes?: string | undefined;
    idempotencyKey?: string | undefined;
}, {
    startedAt?: string | undefined;
    locationLabel?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    notes?: string | undefined;
    idempotencyKey?: string | undefined;
}>;
export declare const ClockOutSchema: z.ZodObject<{
    endedAt: z.ZodOptional<z.ZodString>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    idempotencyKey?: string | undefined;
    endedAt?: string | undefined;
}, {
    idempotencyKey?: string | undefined;
    endedAt?: string | undefined;
}>;
export declare const BreakSchema: z.ZodObject<{
    startedAt: z.ZodString;
    endedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    startedAt: string;
    endedAt: string;
}, {
    startedAt: string;
    endedAt: string;
}>;
export declare const CreateSessionSchema: z.ZodObject<{
    startedAt: z.ZodString;
    endedAt: z.ZodOptional<z.ZodString>;
    locationLabel: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    breaks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        startedAt: z.ZodString;
        endedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        startedAt: string;
        endedAt: string;
    }, {
        startedAt: string;
        endedAt: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    startedAt: string;
    locationLabel?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    notes?: string | undefined;
    endedAt?: string | undefined;
    breaks?: {
        startedAt: string;
        endedAt: string;
    }[] | undefined;
}, {
    startedAt: string;
    locationLabel?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    notes?: string | undefined;
    endedAt?: string | undefined;
    breaks?: {
        startedAt: string;
        endedAt: string;
    }[] | undefined;
}>;
export declare const UpdateSessionSchema: z.ZodObject<{
    startedAt: z.ZodOptional<z.ZodString>;
    endedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    locationLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    latitude: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    breaks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        startedAt: z.ZodString;
        endedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        startedAt: string;
        endedAt: string;
    }, {
        startedAt: string;
        endedAt: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    startedAt?: string | undefined;
    locationLabel?: string | null | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    notes?: string | null | undefined;
    endedAt?: string | null | undefined;
    breaks?: {
        startedAt: string;
        endedAt: string;
    }[] | undefined;
}, {
    startedAt?: string | undefined;
    locationLabel?: string | null | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    notes?: string | null | undefined;
    endedAt?: string | null | undefined;
    breaks?: {
        startedAt: string;
        endedAt: string;
    }[] | undefined;
}>;
export declare const DateRangeQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    from?: string | undefined;
    to?: string | undefined;
}, {
    from?: string | undefined;
    to?: string | undefined;
}>;
export declare const ReportQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
    format: z.ZodDefault<z.ZodEnum<["html", "text", "csv"]>>;
}, "strip", z.ZodTypeAny, {
    format: "html" | "text" | "csv";
    from?: string | undefined;
    to?: string | undefined;
}, {
    from?: string | undefined;
    to?: string | undefined;
    format?: "html" | "text" | "csv" | undefined;
}>;
export declare const UpdateSettingsSchema: z.ZodObject<{
    standardDailyMinutes: z.ZodOptional<z.ZodNumber>;
    roundingRule: z.ZodOptional<z.ZodEnum<["NONE", "NEAREST_5", "NEAREST_10", "NEAREST_15"]>>;
    overtimeStartsAfterMinutes: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    allowNegativeTil: z.ZodOptional<z.ZodBoolean>;
    workLocationGeofenceName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reportRecipientEmails: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    reportSubjectTemplate: z.ZodOptional<z.ZodString>;
    reportFooter: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    standardDailyMinutes?: number | undefined;
    roundingRule?: "NONE" | "NEAREST_5" | "NEAREST_10" | "NEAREST_15" | undefined;
    overtimeStartsAfterMinutes?: number | null | undefined;
    allowNegativeTil?: boolean | undefined;
    workLocationGeofenceName?: string | null | undefined;
    reportRecipientEmails?: string[] | undefined;
    reportSubjectTemplate?: string | undefined;
    reportFooter?: string | undefined;
}, {
    standardDailyMinutes?: number | undefined;
    roundingRule?: "NONE" | "NEAREST_5" | "NEAREST_10" | "NEAREST_15" | undefined;
    overtimeStartsAfterMinutes?: number | null | undefined;
    allowNegativeTil?: boolean | undefined;
    workLocationGeofenceName?: string | null | undefined;
    reportRecipientEmails?: string[] | undefined;
    reportSubjectTemplate?: string | undefined;
    reportFooter?: string | undefined;
}>;
export type ClockInInput = z.infer<typeof ClockInSchema>;
export type ClockOutInput = z.infer<typeof ClockOutSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;
//# sourceMappingURL=schemas.d.ts.map