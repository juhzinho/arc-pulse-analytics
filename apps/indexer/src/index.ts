import { refreshAggregates } from "./services/aggregation";
import { runIndexerLoop } from "./services/indexer";
import { startMarketResolutionWorker } from "./services/worker";
import { logger } from "./lib/logger";
import { prisma } from "./lib/db";
import { aggregateRefreshFailuresTotal, startMetricsServer } from "./lib/observability";
import { redis } from "./lib/redis";
import { startTracing, stopTracing } from "./lib/tracing";

async function main() {
  await startTracing(process.env.OTEL_SERVICE_NAME ?? "arc-pulse-indexer");
  const metricsServer = startMetricsServer();
  const worker = startMarketResolutionWorker();

  setInterval(() => {
    refreshAggregates(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)).catch((error) => {
      aggregateRefreshFailuresTotal.inc();
      logger.error({ error }, "aggregate refresh failed");
    });
  }, 60_000);

  await runIndexerLoop();

  metricsServer.close();
  await worker.close();
}

main().catch(async (error) => {
  logger.error({ error }, "indexer fatal");
  await stopTracing();
  await Promise.all([prisma.$disconnect(), redis.quit()]);
  process.exit(1);
});
