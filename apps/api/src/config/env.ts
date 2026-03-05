import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url))
});

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/arc_pulse";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.ARC_RPC_URL ??= "http://localhost:8545";
process.env.JWT_SECRET ??= "dev-only-secret-key";
process.env.ALLOWED_ORIGIN ??= "http://localhost:3000";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/arc_pulse"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  ARC_RPC_URL: z.string().url().default("http://localhost:8545"),
  JWT_SECRET: z.string().min(16).default("dev-only-secret-key"),
  ALLOWED_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  ADMIN_EMAILS: z.string().default(""),
  WEB_URL: z.string().url().default("http://localhost:3000"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Arc Pulse <no-reply@example.com>")
});

export const env = (() => {
  const parsed = envSchema.parse(process.env);
  return {
    ...parsed,
    ADMIN_EMAILS: parsed.ADMIN_EMAILS.split(",").map((value) => value.trim()).filter(Boolean)
  };
})();
