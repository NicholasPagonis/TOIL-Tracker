"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const prisma_1 = require("./lib/prisma");
const PORT = parseInt(process.env.PORT ?? "3001", 10);
async function main() {
    // Verify database connection
    await prisma_1.prisma.$connect();
    console.log("✓ Database connected");
    const server = app_1.default.listen(PORT, () => {
        console.log(`✓ TOIL Tracker server running on http://localhost:${PORT}`);
        console.log(`  Environment: ${process.env.NODE_ENV ?? "development"}`);
        console.log(`  Auth: ${process.env.API_KEY ? "enabled (X-API-KEY)" : "disabled"}`);
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`\nReceived ${signal}. Shutting down gracefully...`);
        server.close(async () => {
            await prisma_1.prisma.$disconnect();
            console.log("✓ Database disconnected");
            process.exit(0);
        });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}
main().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map