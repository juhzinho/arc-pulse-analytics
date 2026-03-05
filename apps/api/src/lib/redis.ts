import Redis from "ioredis";
import type { FastifyBaseLogger } from "fastify";

export function createRedisClient(url: string, logger?: FastifyBaseLogger) {
  const redis = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });

  redis.on("error", (error) => {
    logger?.error({ error }, "redis error");
  });

  return redis;
}
