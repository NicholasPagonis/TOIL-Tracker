"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.createError = createError;
const zod_1 = require("zod");
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: "Validation Error",
            message: "Request validation failed",
            details: err.errors.map((e) => ({
                path: e.path.join("."),
                message: e.message,
            })),
        });
        return;
    }
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "Internal Server Error";
    if (statusCode === 500) {
        console.error("Unhandled error:", err);
    }
    res.status(statusCode).json({
        error: statusCode === 500 ? "Internal Server Error" : err.name || "Error",
        message,
        ...(err.details ? { details: err.details } : {}),
    });
}
function createError(message, statusCode, details) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.details = details;
    return err;
}
//# sourceMappingURL=error.js.map