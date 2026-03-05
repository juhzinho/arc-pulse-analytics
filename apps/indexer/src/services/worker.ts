import { Worker } from "bullmq";
import { prisma } from "../lib/db";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";
import { marketResolutionTotal } from "../lib/observability";
import { resolveMarketById } from "./resolution";

export function startMarketResolutionWorker() {
  const isTest = process.env.NODE_ENV === "test";
  return new Worker("market-resolution", async (job) => {
    const market = await prisma.market.findUnique({ where: { id: job.data.marketId } });
    if (!market) return;
    const resolved = await resolveMarketById(market.id);
    if (resolved) {
      marketResolutionTotal.inc();
      logger.info({ marketId: market.id }, "market resolved");
    }
  }, {
    connection: redis as never,
    concurrency: 4,
    ...(isTest ? { skipVersionCheck: true } : {})
  });
}
