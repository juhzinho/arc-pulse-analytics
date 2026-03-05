import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url))
});

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/arc_pulse";

export const prisma = new PrismaClient({
  log: ["warn", "error"]
});
