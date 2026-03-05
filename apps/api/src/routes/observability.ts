import type { FastifyInstance } from "fastify";
import { apiMetricsRegistry } from "../lib/observability";

export async function observabilityRoutes(app: FastifyInstance) {
  app.get("/observability/metrics", async (_request, reply) => {
    reply.header("Content-Type", apiMetricsRegistry.contentType);
    return apiMetricsRegistry.metrics();
  });
}
