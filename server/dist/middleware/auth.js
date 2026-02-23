"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
function authMiddleware(req, res, next) {
    const apiKey = process.env.API_KEY;
    // If API_KEY is not configured, allow all requests
    if (!apiKey) {
        next();
        return;
    }
    // Only protect /api/* routes
    if (!req.path.startsWith("/api/")) {
        next();
        return;
    }
    const provided = req.headers["x-api-key"];
    if (!provided || provided !== apiKey) {
        res.status(401).json({
            error: "Unauthorized",
            message: "Valid X-API-KEY header is required",
        });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map