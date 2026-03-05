import {
  addressActivityQuerySchema,
  addressSummaryParamsSchema,
  addressSummaryQuerySchema,
  blockParamsSchema,
  rangeQuerySchema,
  recentQuerySchema,
  searchQuerySchema,
  summaryQuerySchema,
  transactionParamsSchema,
  topContractsQuerySchema
} from "@arc-pulse/shared";
import type { FastifyInstance } from "fastify";
import { sseConnectionsGauge } from "../lib/observability";
import { error, ok } from "../lib/response";
import { getAddressActivity, getAddressCounterparties, getBlockDetail, getCachedGasSeries, getCachedSummary, getCachedTpsSeries, getTopContracts, getAddressSummary, getTransactionDetail, searchNetwork } from "../services/metrics.service";

export async function metricsRoutes(app: FastifyInstance) {
  app.get("/metrics/summary", async (request, reply) => {
    const parsed = summaryQuerySchema.safeParse(request.query);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    return ok(reply, await getCachedSummary(app), { window: parsed.data.window });
  });

  app.get("/metrics/tps", async (request, reply) => {
    const parsed = rangeQuerySchema.safeParse(request.query);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    return ok(reply, await getCachedTpsSeries(app, parsed.data.from, parsed.data.to));
  });

  app.get("/metrics/gas", async (request, reply) => {
    const parsed = rangeQuerySchema.safeParse(request.query);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    return ok(reply, await getCachedGasSeries(app, parsed.data.from, parsed.data.to));
  });

  app.get("/top/contracts", async (request, reply) => {
    const parsed = topContractsQuerySchema.safeParse(request.query);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    return ok(reply, await getTopContracts(app, parsed.data));
  });

  app.get("/blocks/recent", async (request, reply) => {
    const parsed = recentQuerySchema.safeParse(request.query);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    const blocks = await app.prisma.block.findMany({
      orderBy: { number: "desc" },
      take: parsed.data.limit
    });
    return ok(reply, blocks.map((block) => ({
      ...block,
      number: block.number.toString(),
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
      baseFeePerGas: block.baseFeePerGas?.toString() ?? null
    })));
  });

  app.get("/tx/recent", async (request, reply) => {
    const parsed = recentQuerySchema.safeParse(request.query);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    const transactions = await app.prisma.transaction.findMany({
      orderBy: { blockNumber: "desc" },
      take: parsed.data.limit
    });
    return ok(reply, transactions.map((transaction) => ({
      ...transaction,
      blockNumber: transaction.blockNumber.toString(),
      gasUsed: transaction.gasUsed.toString(),
      gasPrice: transaction.gasPrice?.toString() ?? null,
      effectiveGasPrice: transaction.effectiveGasPrice?.toString() ?? null
    })));
  });

  app.get("/blocks/:number", async (request, reply) => {
    const params = blockParamsSchema.safeParse(request.params);
    if (!params.success) return error(reply, 400, "Invalid input", params.error.flatten());
    const result = await getBlockDetail(app, params.data.number);
    if (!result) return error(reply, 404, "Block not found");
    return ok(reply, result);
  });

  app.get("/tx/:hash", async (request, reply) => {
    const params = transactionParamsSchema.safeParse(request.params);
    if (!params.success) return error(reply, 400, "Invalid input", params.error.flatten());
    const result = await getTransactionDetail(app, params.data.hash);
    if (!result) return error(reply, 404, "Transaction not found");
    return ok(reply, result);
  });

  app.get("/address/:addr/summary", async (request, reply) => {
    const params = addressSummaryParamsSchema.safeParse(request.params);
    const query = addressSummaryQuerySchema.safeParse(request.query);
    if (!params.success || !query.success) return error(reply, 400, "Invalid input");
    return ok(reply, await getAddressSummary(app, params.data.addr, query.data.window));
  });

  app.get("/address/:addr/activity", async (request, reply) => {
    const params = addressSummaryParamsSchema.safeParse(request.params);
    const query = addressActivityQuerySchema.safeParse(request.query);
    if (!params.success || !query.success) return error(reply, 400, "Invalid input");
    return ok(reply, await getAddressActivity(app, {
      address: params.data.addr,
      page: query.data.page,
      pageSize: query.data.pageSize,
      window: query.data.window,
      direction: query.data.direction
    }));
  });

  app.get("/address/:addr/counterparties", async (request, reply) => {
    const params = addressSummaryParamsSchema.safeParse(request.params);
    const query = addressSummaryQuerySchema.safeParse(request.query);
    if (!params.success || !query.success) return error(reply, 400, "Invalid input");
    return ok(reply, await getAddressCounterparties(app, {
      address: params.data.addr,
      window: query.data.window,
      limit: 8
    }));
  });

  app.get("/search", async (request, reply) => {
    const parsed = searchQuerySchema.safeParse(request.query);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    const result = await searchNetwork(app, parsed.data.q);
    if (!result) return error(reply, 404, "Entity not found");
    return ok(reply, result);
  });

  app.get("/stream/metrics", async (_request, reply) => {
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders();
    sseConnectionsGauge.inc();

    const timer = setInterval(async () => {
      const summary = await getCachedSummary(app);
      reply.raw.write("event: summary\n");
      reply.raw.write(`data: ${JSON.stringify(summary)}\n\n`);
    }, 3000);

    reply.raw.on("close", () => {
      clearInterval(timer);
      sseConnectionsGauge.dec();
      reply.raw.end();
    });
  });
}
