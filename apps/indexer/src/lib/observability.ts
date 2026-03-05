import { createServer } from "node:http";
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client/index.js";
import { config } from "../config";
import { logger } from "./logger";

export const indexerMetricsRegistry = new Registry();

collectDefaultMetrics({
  register: indexerMetricsRegistry,
  prefix: "arc_pulse_indexer_"
});

export const indexedBlocksTotal = new Counter({
  name: "arc_pulse_indexer_blocks_indexed_total",
  help: "Total indexed blocks",
  registers: [indexerMetricsRegistry]
});

export const indexedTransactionsTotal = new Counter({
  name: "arc_pulse_indexer_transactions_indexed_total",
  help: "Total indexed transactions",
  registers: [indexerMetricsRegistry]
});

export const indexerLoopFailuresTotal = new Counter({
  name: "arc_pulse_indexer_loop_failures_total",
  help: "Total indexer loop failures",
  registers: [indexerMetricsRegistry]
});

export const aggregateRefreshFailuresTotal = new Counter({
  name: "arc_pulse_indexer_aggregate_refresh_failures_total",
  help: "Total aggregate refresh failures",
  registers: [indexerMetricsRegistry]
});

export const marketResolutionTotal = new Counter({
  name: "arc_pulse_indexer_market_resolutions_total",
  help: "Total resolved markets by worker",
  registers: [indexerMetricsRegistry]
});

export const batchDurationMs = new Histogram({
  name: "arc_pulse_indexer_batch_duration_ms",
  help: "Batch indexing duration in milliseconds",
  buckets: [50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000],
  registers: [indexerMetricsRegistry]
});

export const lastIndexedBlockGauge = new Gauge({
  name: "arc_pulse_indexer_last_indexed_block",
  help: "Last indexed block checkpoint",
  registers: [indexerMetricsRegistry]
});

export const chainHeadGauge = new Gauge({
  name: "arc_pulse_indexer_chain_head_block",
  help: "Observed Arc chain head block",
  registers: [indexerMetricsRegistry]
});

export function startMetricsServer() {
  const server = createServer(async (_request, response) => {
    response.statusCode = 200;
    response.setHeader("Content-Type", indexerMetricsRegistry.contentType);
    response.end(await indexerMetricsRegistry.metrics());
  });

  server.listen(config.METRICS_PORT, "0.0.0.0", () => {
    logger.info({ port: config.METRICS_PORT }, "indexer metrics server listening");
  });

  return server;
}
