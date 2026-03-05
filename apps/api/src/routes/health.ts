import type { FastifyInstance } from "fastify";
import { healthStatusGauge } from "../lib/observability";
import { ok } from "../lib/response";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    const checks = await Promise.allSettled([
      app.prisma.$queryRaw`SELECT 1`,
      app.redis.ping()
    ]);

    const databaseHealthy = checks[0].status === "fulfilled";
    const redisHealthy = checks[1].status === "fulfilled" && checks[1].value === "PONG";

    healthStatusGauge.set({ dependency: "database" }, databaseHealthy ? 1 : 0);
    healthStatusGauge.set({ dependency: "redis" }, redisHealthy ? 1 : 0);

    return ok(reply, {
      status: databaseHealthy && redisHealthy ? "ok" : "degraded",
      checks: {
        database: databaseHealthy ? "ok" : "error",
        redis: redisHealthy ? "PONG" : "ERROR"
      }
    });
  });
}
