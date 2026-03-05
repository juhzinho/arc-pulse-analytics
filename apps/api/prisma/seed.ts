import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url))
});

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@example.com",
      role: "ADMIN"
    }
  });
}

main().finally(() => prisma.$disconnect());
