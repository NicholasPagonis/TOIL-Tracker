import { Router, Request, Response, NextFunction } from "express";
import * as fs from "fs";
import * as path from "path";
import { UpdateDbConfigSchema } from "../validation/schemas";

const router = Router();

const ENV_FILE = path.resolve(process.cwd(), ".env");

export interface DbConfigInfo {
  provider: "sqlite" | "mysql" | "unknown";
  file?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  hasPassword?: boolean;
}

function parseDbUrl(url: string | undefined): DbConfigInfo {
  if (!url || url.startsWith("file:")) {
    return { provider: "sqlite", file: url ?? "file:./dev.db" };
  }
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.replace(":", "");
    if (protocol !== "mysql") {
      return { provider: "unknown" };
    }
    return {
      provider: "mysql",
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      database: parsed.pathname.replace(/^\//, ""),
      user: parsed.username,
      hasPassword: !!parsed.password,
    };
  } catch {
    return { provider: "unknown" };
  }
}

function buildMysqlUrl(
  host: string,
  port: number | undefined,
  database: string,
  user: string,
  password: string | undefined
): string {
  const encodedUser = encodeURIComponent(user);
  const encodedPass = password ? encodeURIComponent(password) : "";
  const portPart = port && port !== 3306 ? `:${port}` : "";
  return `mysql://${encodedUser}:${encodedPass}@${host}${portPart}/${database}`;
}

function updateEnvFile(key: string, value: string): void {
  let content = "";
  if (fs.existsSync(ENV_FILE)) {
    content = fs.readFileSync(ENV_FILE, "utf-8");
  }
  // Escape backslashes first, then double quotes so the value is safe inside double-quoted .env
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (new RegExp(`^${key}=`, "m").test(content)) {
    content = content.replace(
      new RegExp(`^${key}=.*`, "m"),
      `${key}="${escaped}"`
    );
  } else {
    content = content.endsWith("\n")
      ? `${content}${key}="${escaped}"\n`
      : `${content}\n${key}="${escaped}"\n`;
  }
  fs.writeFileSync(ENV_FILE, content, "utf-8");
}

// GET /api/db/config
router.get(
  "/config",
  (_req: Request, res: Response) => {
    res.json(parseDbUrl(process.env.DATABASE_URL));
  }
);

// PUT /api/db/config
router.put(
  "/config",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = UpdateDbConfigSchema.parse(req.body);
      let databaseUrl: string;

      if (body.provider === "sqlite") {
        databaseUrl = body.file ?? "file:./dev.db";
      } else {
        databaseUrl = buildMysqlUrl(
          body.host,
          body.port,
          body.database,
          body.user,
          body.password
        );
      }

      updateEnvFile("DATABASE_URL", databaseUrl);

      res.json({
        message:
          "Database configuration saved. Restart the server to apply changes.",
        config: parseDbUrl(databaseUrl),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
