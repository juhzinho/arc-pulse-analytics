import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

const WINDOW_SQL: Record<string, Prisma.Sql> = {
  "1h": Prisma.sql`interval '1 hour'`,
  "6h": Prisma.sql`interval '6 hours'`,
  "24h": Prisma.sql`interval '24 hours'`,
  "7d": Prisma.sql`interval '7 days'`
};

export async function getSummary(prisma: PrismaClient) {
  const [latestMinute] = await prisma.$queryRaw<Array<{
    tps: number;
    gasTotal24h: bigint;
    gasP50_24h: bigint;
    gasP95_24h: bigint;
    blockTimeAvg1h: number;
  }>>(Prisma.sql`
    WITH latest_minute AS (
      SELECT tps
      FROM "MetricMinute"
      ORDER BY "bucketStart" DESC
      LIMIT 1
    ),
    gas_24h AS (
      SELECT
        COALESCE(SUM("gasTotal"), 0) AS "gasTotal24h",
        COALESCE(PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY "gasP50"), 0) AS "gasP50_24h",
        COALESCE(PERCENTILE_DISC(0.95) WITHIN GROUP (ORDER BY "gasP95"), 0) AS "gasP95_24h"
      FROM "MetricHour"
      WHERE "bucketStart" >= NOW() - interval '24 hours'
    ),
    block_1h AS (
      SELECT COALESCE(AVG("blockTimeAvg"), 0) AS "blockTimeAvg1h"
      FROM "MetricMinute"
      WHERE "bucketStart" >= NOW() - interval '1 hour'
    )
    SELECT
      COALESCE((SELECT tps FROM latest_minute), 0) AS tps,
      (SELECT "gasTotal24h" FROM gas_24h) AS "gasTotal24h",
      (SELECT "gasP50_24h" FROM gas_24h) AS "gasP50_24h",
      (SELECT "gasP95_24h" FROM gas_24h) AS "gasP95_24h",
      (SELECT "blockTimeAvg1h" FROM block_1h) AS "blockTimeAvg1h"
  `);

  return {
    tpsCurrent: latestMinute?.tps ?? 0,
    gasTotal24h: String(latestMinute?.gasTotal24h ?? 0n),
    gasP50_24h: String(latestMinute?.gasP50_24h ?? 0n),
    gasP95_24h: String(latestMinute?.gasP95_24h ?? 0n),
    blockTimeAvg1h: latestMinute?.blockTimeAvg1h ?? 0
  };
}

export async function getSeries(
  prisma: PrismaClient,
  table: "MetricMinute" | "MetricHour",
  from: string,
  to: string
) {
  const query = {
    where: {
      bucketStart: {
        gte: new Date(from),
        lte: new Date(to)
      }
    },
    orderBy: {
      bucketStart: "asc" as const
    }
  };

  return table === "MetricMinute"
    ? prisma.metricMinute.findMany(query)
    : prisma.metricHour.findMany(query);
}

export function getWindowInterval(window: string) {
  return WINDOW_SQL[window] ?? WINDOW_SQL["24h"];
}
