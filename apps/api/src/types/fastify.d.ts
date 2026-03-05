import "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "@arc-pulse/shared";
import type { PrismaClient, User } from "@prisma/client";
import type Redis from "ioredis";
import type { Queue } from "bullmq";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    config: {
      NODE_ENV: string;
      PORT: number;
      DATABASE_URL: string;
      REDIS_URL: string;
      ARC_RPC_URL: string;
      JWT_SECRET: string;
      ALLOWED_ORIGIN: string;
      ADMIN_EMAILS: string[];
      WEB_URL: string;
      SMTP_HOST?: string;
      SMTP_PORT: number;
      SMTP_SECURE: boolean;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      SMTP_FROM: string;
    };
    marketQueue: Queue;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
  }

  interface FastifyRequest {
    authUser?: User & { role: UserRole };
    metricsStartAt?: number;
  }
}
