import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth";
import { healthRoutes } from "./health";
import { marketsRoutes } from "./markets";
import { metricsRoutes } from "./metrics";
import { observabilityRoutes } from "./observability";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(async (v1) => {
    await authRoutes(v1);
    await healthRoutes(v1);
    await metricsRoutes(v1);
    await marketsRoutes(v1);
    await observabilityRoutes(v1);
  }, { prefix: "/v1" });
}
