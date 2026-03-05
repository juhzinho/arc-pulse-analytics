import { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";

export async function resolveMarketById(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { predictions: true }
  });
  if (!market || market.status !== "open" || market.windowEnd > new Date()) return null;

  const resolvedValue = await getResolvedMetric(market.metric, market.windowStart, market.windowEnd);
  const outcome = market.type === "binary"
    ? resolvedValue > (market.threshold ?? 0) ? "YES" : "NO"
    : resolvedValue >= (market.lowerBound ?? 0) && resolvedValue <= (market.upperBound ?? 0) ? "IN_RANGE" : "OUT_OF_RANGE";

  await prisma.$transaction(async (tx) => {
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

  await refreshLeaderboardSnapshots();
  return market.id;
}

async function getResolvedMetric(metric: string, from: Date, to: Date) {
  if (metric === "top_contract") {
    const contract = await prisma.contractStatWindow.findFirst({
      where: { window: "24h" },
      orderBy: { txCount: "desc" }
    });
    return contract?.txCount ?? 0;
  }

  if (metric === "tps") {
    const result = await prisma.metricMinute.aggregate({
      where: { bucketStart: { gte: from, lte: to } },
      _avg: { tps: true }
    });
    return result._avg.tps ?? 0;
  }

  if (metric === "gas_total") {
    const [result] = await prisma.$queryRaw<Array<{ value: bigint }>>(Prisma.sql`
      SELECT COALESCE(SUM("gasTotal"), 0)::bigint AS value
      FROM "MetricHour"
      WHERE "bucketStart" >= ${from} AND "bucketStart" <= ${to}
    `);
    return Number(result?.value ?? 0n);
  }

  const result = await prisma.metricMinute.aggregate({
    where: { bucketStart: { gte: from, lte: to } },
    _avg: { blockTimeAvg: true }
  });
  return result._avg.blockTimeAvg ?? 0;
}

async function refreshLeaderboardSnapshots() {
  for (const period of ["7d", "30d"]) {
    const since = new Date(Date.now() - (period === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000);
    const stats = await prisma.prediction.groupBy({
      by: ["userId"],
      where: {
        updatedAt: { gte: since },
        score: { not: null }
      },
      _avg: { score: true },
      _count: { id: true }
    });

    await Promise.all(stats.map((item) =>
      prisma.leaderboardSnapshot.upsert({
        where: { period_userId: { period, userId: item.userId } },
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
