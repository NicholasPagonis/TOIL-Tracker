"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./middleware/auth");
const error_1 = require("./middleware/error");
const sessions_1 = __importDefault(require("./routes/sessions"));
const summary_1 = __importDefault(require("./routes/summary"));
const report_1 = __importDefault(require("./routes/report"));
const settings_1 = __importDefault(require("./routes/settings"));
const app = (0, express_1.default)();
// CORS – open for development; tighten in production via env
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-API-KEY"],
}));
// Body parsing
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting: 100 requests per minute per IP
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again in a minute.",
    },
});
app.use("/api/", limiter);
// Auth middleware (checks X-API-KEY if API_KEY env var is set)
app.use(auth_1.authMiddleware);
// Health check (unauthenticated)
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// API routes
app.use("/api/sessions", sessions_1.default);
app.use("/api/summary", summary_1.default);
app.use("/api/report", report_1.default);
app.use("/api/settings", settings_1.default);
// 404 handler for unknown API routes
app.use("/api/", (_req, res) => {
    res.status(404).json({ error: "Not Found", message: "Route not found" });
});
// Global error handler (must be last)
app.use(error_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map