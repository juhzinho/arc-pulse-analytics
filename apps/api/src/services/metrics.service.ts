import { Prisma } from "@prisma/client";
import { cacheKey } from "@arc-pulse/shared";
import { getOrSetJson } from "../lib/cache";
import { getSeries, getSummary, getWindowInterval } from "../lib/metrics";
import type { FastifyInstance } from "fastify";

export async function getCachedSummary(app: FastifyInstance) {
  return getOrSetJson(app.redis, cacheKey(["summary"]), 5, () => getSummary(app.prisma));
}

export async function getCachedTpsSeries(app: FastifyInstance, from: string, to: string) {
  return getOrSetJson(app.redis, cacheKey(["series", "tps", from, to]), 30, async () => {
    const rows = await getSeries(app.prisma, "MetricMinute", from, to);
    return rows.map((row: Awaited<ReturnType<typeof app.prisma.metricMinute.findMany>>[number]) => ({
      bucketStart: row.bucketStart.toISOString(),
      value: row.tps
    }));
  });
}

export async function getCachedGasSeries(app: FastifyInstance, from: string, to: string) {
  return getOrSetJson(app.redis, cacheKey(["series", "gas", from, to]), 30, async () => {
    const rows = await getSeries(app.prisma, "MetricHour", from, to);
    return rows.map((row: Awaited<ReturnType<typeof app.prisma.metricHour.findMany>>[number]) => ({
      bucketStart: row.bucketStart.toISOString(),
      value: Number(row.gasTotal)
    }));
  });
}

export async function getTopContracts(
  app: FastifyInstance,
  input: { window: string; sort: "gas" | "tx"; page: number; pageSize: number; address?: string }
) {
  return getOrSetJson(
    app.redis,
    cacheKey(["top-contracts", input.window, input.sort, input.page, input.pageSize, input.address]),
    30,
    async () => {
      const where = {
        window: input.window,
        ...(input.address ? { address: input.address } : {})
      };
      const [items, total] = await Promise.all([
        app.prisma.contractStatWindow.findMany({
          where,
          orderBy: input.sort === "gas" ? { gasTotal: "desc" } : { txCount: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize
        }),
        app.prisma.contractStatWindow.count({ where })
      ]);

      return {
        items: items.map((item) => ({
          ...item,
          gasTotal: item.gasTotal.toString()
        })),
        total,
        page: input.page,
        pageSize: input.pageSize
      };
    }
  );
}

export async function getAddressSummary(app: FastifyInstance, address: string, window: string) {
  const normalizedAddress = address.toLowerCase();
  const interval = getWindowInterval(window);
  const [summary] = await app.prisma.$queryRaw<Array<{
    txCount: bigint;
    gasTotal: bigint;
    successRate: number;
    sentTxCount: bigint;
    receivedTxCount: bigint;
    contractInteractions: bigint;
    firstSeen: Date | null;
    lastSeen: Date | null;
  }>>(Prisma.sql`
    SELECT
      COUNT(*)::bigint AS "txCount",
      COALESCE(SUM("gasUsed"), 0)::bigint AS "gasTotal",
      COALESCE(AVG(CASE WHEN status THEN 1 ELSE 0 END), 0) AS "successRate",
      COALESCE(SUM(CASE WHEN "fromAddress" = ${normalizedAddress} THEN 1 ELSE 0 END), 0)::bigint AS "sentTxCount",
      COALESCE(SUM(CASE WHEN "toAddress" = ${normalizedAddress} THEN 1 ELSE 0 END), 0)::bigint AS "receivedTxCount",
      COALESCE(SUM(CASE WHEN "toAddress" IS NOT NULL AND "fromAddress" = ${normalizedAddress} THEN 1 ELSE 0 END), 0)::bigint AS "contractInteractions",
      MIN("blockTimestamp") AS "firstSeen",
      MAX("blockTimestamp") AS "lastSeen"
    FROM "Transaction"
    WHERE ("fromAddress" = ${normalizedAddress} OR "toAddress" = ${normalizedAddress})
      AND "blockTimestamp" >= NOW() - ${interval}
  `);

  return {
    address: normalizedAddress,
    txCount: Number(summary?.txCount ?? 0n),
    gasTotal: String(summary?.gasTotal ?? 0n),
    successRate: summary?.successRate ?? 0,
    sentTxCount: Number(summary?.sentTxCount ?? 0n),
    receivedTxCount: Number(summary?.receivedTxCount ?? 0n),
    contractInteractions: Number(summary?.contractInteractions ?? 0n),
    firstSeen: summary?.firstSeen?.toISOString() ?? null,
    lastSeen: summary?.lastSeen?.toISOString() ?? null
  };
}

export async function getAddressActivity(
  app: FastifyInstance,
  input: { address: string; page: number; pageSize: number; window?: string; direction?: "in" | "out" | "all" }
) {
  const normalizedAddress = input.address.toLowerCase();
  const where = {
    ...(input.direction === "out"
      ? { fromAddress: normalizedAddress }
      : input.direction === "in"
        ? { toAddress: normalizedAddress }
        : {
            OR: [
              { fromAddress: normalizedAddress },
              { toAddress: normalizedAddress }
            ]
          }),
    ...(input.window
      ? {
          blockTimestamp: {
            gte: new Date(Date.now() - getWindowMs(input.window))
          }
        }
      : {})
  };

  const [items, total] = await Promise.all([
    app.prisma.transaction.findMany({
      where,
      orderBy: { blockNumber: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize
    }),
    app.prisma.transaction.count({ where })
  ]);

  return {
    items: items.map((transaction) => ({
      ...transaction,
      blockNumber: transaction.blockNumber.toString(),
      gasUsed: transaction.gasUsed.toString(),
      gasPrice: transaction.gasPrice?.toString() ?? null,
      effectiveGasPrice: transaction.effectiveGasPrice?.toString() ?? null,
      direction: transaction.fromAddress.toLowerCase() === normalizedAddress ? "out" : "in"
    })),
    total,
    page: input.page,
    pageSize: input.pageSize
  };
}

export async function getAddressCounterparties(
  app: FastifyInstance,
  input: { address: string; window: string; limit: number }
) {
  const normalizedAddress = input.address.toLowerCase();
  const interval = getWindowInterval(input.window);

  const rows = await app.prisma.$queryRaw<Array<{
    counterparty: string | null;
    txCount: bigint;
    gasTotal: bigint;
  }>>(Prisma.sql`
    SELECT
      "toAddress" AS "counterparty",
      COUNT(*)::bigint AS "txCount",
      COALESCE(SUM("gasUsed"), 0)::bigint AS "gasTotal"
    FROM "Transaction"
    WHERE "fromAddress" = ${normalizedAddress}
      AND "blockTimestamp" >= NOW() - ${interval}
      AND "toAddress" IS NOT NULL
    GROUP BY "toAddress"
    ORDER BY COUNT(*) DESC, COALESCE(SUM("gasUsed"), 0) DESC
    LIMIT ${input.limit}
  `);

  return rows.map((row) => ({
    address: row.counterparty,
    txCount: Number(row.txCount),
    gasTotal: row.gasTotal.toString()
  }));
}

export async function searchNetwork(app: FastifyInstance, rawQuery: string) {
  const query = rawQuery.trim();

  if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
    const summary = await getAddressSummary(app, query, "24h");
    return {
      kind: "address" as const,
      address: summary.address,
      summary
    };
  }

  if (/^\d+$/.test(query)) {
    const block = await app.prisma.block.findUnique({
      where: { number: BigInt(query) }
    });

    if (!block) return null;

    return {
      kind: "block" as const,
      block: {
        ...block,
        number: block.number.toString(),
        gasUsed: block.gasUsed.toString(),
        gasLimit: block.gasLimit.toString(),
        baseFeePerGas: block.baseFeePerGas?.toString() ?? null
      }
    };
  }

  if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
    const transaction = await app.prisma.transaction.findUnique({
      where: { hash: query.toLowerCase() }
    });

    if (transaction) {
      return {
        kind: "transaction" as const,
        transaction: {
          ...transaction,
          blockNumber: transaction.blockNumber.toString(),
          gasUsed: transaction.gasUsed.toString(),
          gasPrice: transaction.gasPrice?.toString() ?? null,
          effectiveGasPrice: transaction.effectiveGasPrice?.toString() ?? null
        }
      };
    }

    const block = await app.prisma.block.findUnique({
      where: { hash: query.toLowerCase() }
    });

    if (block) {
      return {
        kind: "block" as const,
        block: {
          ...block,
          number: block.number.toString(),
          gasUsed: block.gasUsed.toString(),
          gasLimit: block.gasLimit.toString(),
          baseFeePerGas: block.baseFeePerGas?.toString() ?? null
        }
      };
    }
  }

  return null;
}

function getWindowMs(window: string) {
  switch (window) {
    case "1h":
      return 60 * 60 * 1000;
    case "6h":
      return 6 * 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export async function getBlockDetail(app: FastifyInstance, blockNumber: string) {
  const number = BigInt(blockNumber);
  const [block, transactions] = await Promise.all([
    app.prisma.block.findUnique({
      where: { number }
    }),
    app.prisma.transaction.findMany({
      where: { blockNumber: number },
      orderBy: { hash: "asc" },
      take: 100
    })
  ]);

  if (!block) return null;

  return {
    block: {
      ...block,
      number: block.number.toString(),
      gasUsed: block.gasUsed.toString(),
      gasLimit: block.gasLimit.toString(),
      baseFeePerGas: block.baseFeePerGas?.toString() ?? null
    },
    transactions: transactions.map((transaction) => ({
      ...transaction,
      blockNumber: transaction.blockNumber.toString(),
      gasUsed: transaction.gasUsed.toString(),
      gasPrice: transaction.gasPrice?.toString() ?? null,
      effectiveGasPrice: transaction.effectiveGasPrice?.toString() ?? null
    }))
  };
}

export async function getTransactionDetail(app: FastifyInstance, hash: string) {
  const transaction = await app.prisma.transaction.findUnique({
    where: { hash: hash.toLowerCase() }
  });

  if (!transaction) return null;

  return {
    ...transaction,
    blockNumber: transaction.blockNumber.toString(),
    gasUsed: transaction.gasUsed.toString(),
    gasPrice: transaction.gasPrice?.toString() ?? null,
    effectiveGasPrice: transaction.effectiveGasPrice?.toString() ?? null
  };
}
