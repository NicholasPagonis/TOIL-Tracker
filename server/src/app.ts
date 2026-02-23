import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import sessionsRouter from "./routes/sessions";
import summaryRouter from "./routes/summary";
import reportRouter from "./routes/report";
import settingsRouter from "./routes/settings";
import dbRouter from "./routes/db";

const app = express();

// CORS – open for development; tighten in production via env
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-API-KEY"],
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
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
app.use(authMiddleware);

// Health check (unauthenticated)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/sessions", sessionsRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/report", reportRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/db", dbRouter);

// 404 handler for unknown API routes
app.use("/api/", (_req, res) => {
  res.status(404).json({ error: "Not Found", message: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
