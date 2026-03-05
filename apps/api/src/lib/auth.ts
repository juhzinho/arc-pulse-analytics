import { hashValue } from "@arc-pulse/shared";
import type { FastifyRequest } from "fastify";
import type { User } from "@prisma/client";

export function getClientIp(request: FastifyRequest) {
  return request.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ?? request.ip;
}

export async function createSessionToken(request: FastifyRequest, user: User) {
  return request.server.jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role
  }, { expiresIn: "7d" });
}

export function hashToken(token: string) {
  return hashValue(token);
}
