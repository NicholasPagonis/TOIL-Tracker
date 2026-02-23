import "dotenv/config";
import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

async function main(): Promise<void> {
  // Verify database connection
  await prisma.$connect();
  console.log("✓ Database connected");

  const server = app.listen(PORT, () => {
    console.log(`✓ TOIL Tracker server running on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV ?? "development"}`);
    console.log(
      `  Auth: ${process.env.API_KEY ? "enabled (X-API-KEY)" : "disabled"}`
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
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
