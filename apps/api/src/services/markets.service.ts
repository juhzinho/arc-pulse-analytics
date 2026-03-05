import { Prisma } from "@prisma/client";
import { createMarketSchema, marketPredictionSchema } from "@arc-pulse/shared";
import type { FastifyInstance } from "fastify";
import type { z } from "zod";
import { writeAuditLog } from "./audit.service";

type CreateMarketInput = z.infer<typeof createMarketSchema>;
type PredictInput = z.infer<typeof marketPredictionSchema>;

export async function listMarkets(app: FastifyInstance, status?: "open" | "resolved" | "cancelled") {
  return app.prisma.market.findMany({
    where: status ? { status } : undefined,
    include: {
      result: true,
      predictions: { select: { id: true } }
    },
    orderBy: { windowEnd: "asc" }
  });
}

export async function createMarket(app: FastifyInstance, actorId: string, ip: string | undefined, input: CreateMarketInput) {
  const market = await app.prisma.market.create({
    data: {
      ...input,
      windowStart: new Date(input.windowStart),
      windowEnd: new Date(input.windowEnd),
      createdById: actorId
    }
  });

  await app.marketQueue.add("resolve-market", { marketId: market.id }, {
    delay: Math.max(1000, new Date(input.windowEnd).getTime() - Date.now())
  });

  await writeAuditLog(app.prisma, {
    actorId,
    action: "market.create",
    entity: "Market",
    entityId: market.id,
    ip,
    payload: input as Record<string, unknown>
  });

  return market;
}

export async function predictMarket(app: FastifyInstance, marketId: string, userId: string, input: PredictInput) {
  const market = await app.prisma.market.findUnique({ where: { id: marketId } });
  if (!market || market.status !== "open") {
    throw new Error("Market is not open");
  }

  return app.prisma.prediction.upsert({
    where: {
      marketId_userId: { marketId, userId }
    },
    update: input,
    create: {
      marketId,
      userId,
      ...input
    }
  });
}

export async function resolveMarket(app: FastifyInstance, marketId: string, actorId?: string, ip?: string) {
  const market = await app.prisma.market.findUnique({
    where: { id: marketId },
    include: { predictions: true }
  });
  if (!market || market.status !== "open") return null;

  const resolvedValue = await getResolvedMetric(app, market.metric, market.windowStart, market.windowEnd);
  const outcome = market.type === "binary"
    ? resolvedValue > (market.threshold ?? 0) ? "YES" : "NO"
    : resolvedValue >= (market.lowerBound ?? 0) && resolvedValue <= (market.upperBound ?? 0) ? "IN_RANGE" : "OUT_OF_RANGE";

  await app.prisma.$transaction(async (tx) => {
    await tx.market.update({
      where: { id: market.id },
      data: { status: "resolved" }
    });
    await tx.marketResult.upsert({
      where: { marketId: market.id },
      update: { resolvedValue, outcome },
      create: { marketId: market.id, resolvedValue, outcome }
    });

    for (const prediction of market.predictions) {
      const score = market.type === "binary"
        ? Math.pow(((prediction.choice === "YES" ? 1 : 0) - (outcome === "YES" ? 1 : 0)), 2)
        : Math.abs((prediction.value ?? 0) - resolvedValue);

      await tx.prediction.update({
        where: { id: prediction.id },
        data: { score }
      });
    }
  });

  await updateLeaderboard(app);

  if (actorId) {
    await writeAuditLog(app.prisma, {
      actorId,
      action: "market.resolve",
      entity: "Market",
      entityId: market.id,
      ip,
      payload: { resolvedValue, outcome }
    });
  }

  return app.prisma.market.findUnique({
    where: { id: market.id },
    include: { result: true, predictions: true }
  });
}

async function getResolvedMetric(app: FastifyInstance, metric: string, from: Date, to: Date) {
  if (metric === "top_contract") {
    const result = await app.prisma.contractStatWindow.findFirst({
      where: { window: "24h" },
      orderBy: { txCount: "desc" }
    });
    return result?.txCount ?? 0;
  }

  if (metric === "tps") {
    const result = await app.prisma.metricMinute.aggregate({
      where: { bucketStart: { gte: from, lte: to } },
      _avg: { tps: true }
    });
    return result._avg.tps ?? 0;
  }

  if (metric === "gas_total") {
    const [result] = await app.prisma.$queryRaw<Array<{ value: bigint }>>(Prisma.sql`
      SELECT COALESCE(SUM("gasTotal"), 0)::bigint AS value
      FROM "MetricHour"
      WHERE "bucketStart" >= ${from} AND "bucketStart" <= ${to}
    `);
    return Number(result?.value ?? 0n);
  }

  const result = await app.prisma.metricMinute.aggregate({
    where: { bucketStart: { gte: from, lte: to } },
    _avg: { blockTimeAvg: true }
  });
  return result._avg.blockTimeAvg ?? 0;
}

async function updateLeaderboard(app: FastifyInstance) {
  for (const period of ["7d", "30d"]) {
    const since = new Date(Date.now() - (period === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000);
    const stats = await app.prisma.prediction.groupBy({
      by: ["userId"],
      where: {
        updatedAt: { gte: since },
        score: { not: null }
      },
      _avg: { score: true },
      _count: { id: true }
    });

    await Promise.all(stats.map((item) =>
      app.prisma.leaderboardSnapshot.upsert({
        where: {
          period_userId: { period, userId: item.userId }
        },
        update: {
          score: item._avg.score ?? 0,
          accuracy: item._count.id
        },
        create: {
          period,
          userId: item.userId,
          score: item._avg.score ?? 0,
          accuracy: item._count.id
        }
      })
    ));
  }
}
