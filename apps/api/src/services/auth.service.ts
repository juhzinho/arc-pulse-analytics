import { randomBytes } from "node:crypto";
import { hashToken } from "../lib/auth";
import type { PrismaClient, UserRole } from "@prisma/client";

export async function issueMagicLink(prisma: PrismaClient, email: string, adminEmails: string[]) {
  const token = randomBytes(24).toString("hex");
  const tokenHash = hashToken(token);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: adminEmails.includes(email) ? "ADMIN" : undefined },
    create: {
      email,
      role: adminEmails.includes(email) ? ("ADMIN" as UserRole) : "USER"
    }
  });

  await prisma.magicLinkToken.create({
    data: {
      email,
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
  });

  return { token, user };
}

export async function verifyMagicLink(prisma: PrismaClient, email: string, token: string) {
  const tokenHash = hashToken(token);
  const magicLink = await prisma.magicLinkToken.findFirst({
    where: {
      email,
      tokenHash,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!magicLink?.user) return null;

  await prisma.magicLinkToken.delete({ where: { id: magicLink.id } });
  return magicLink.user;
}
