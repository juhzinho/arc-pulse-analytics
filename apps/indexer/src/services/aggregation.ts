import { percentile } from "@arc-pulse/shared";
import { prisma } from "../lib/db";

function minuteBucket(date: Date) {
  const bucket = new Date(date);
  bucket.setSeconds(0, 0);
  return bucket;
}

function hourBucket(date: Date) {
  const bucket = new Date(date);
  bucket.setMinutes(0, 0, 0);
  return bucket;
}

export async function refreshAggregates(since: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      blockTimestamp: { gte: since }
    },
    orderBy: { blockTimestamp: "asc" }
  });

  const minuteMap = new Map<string, typeof transactions>();
  const hourMap = new Map<string, typeof transactions>();

  for (const transaction of transactions) {
    const minute = minuteBucket(transaction.blockTimestamp).toISOString();
    const hour = hourBucket(transaction.blockTimestamp).toISOString();
    minuteMap.set(minute, [...(minuteMap.get(minute) ?? []), transaction]);
    hourMap.set(hour, [...(hourMap.get(hour) ?? []), transaction]);
  }

  await Promise.all([
    upsertRollups("minute", minuteMap),
    upsertRollups("hour", hourMap),
    refreshContractWindows()
  ]);
}

async function upsertRollups(kind: "minute" | "hour", buckets: Map<string, Awaited<ReturnType<typeof prisma.transaction.findMany>>>) {
  for (const [bucketStart, txs] of buckets) {
    const gasValues = txs.map((item) => Number(item.gasUsed)).sort((a, b) => a - b);
    const bucketDate = new Date(bucketStart);

    const first = txs[0]?.blockTimestamp?.getTime() ?? bucketDate.getTime();
    const last = txs[txs.length - 1]?.blockTimestamp?.getTime() ?? first;
    const spanSeconds = Math.max(kind === "minute" ? 60 : 3600, (last - first) / 1000 || 1);
    const blockCount = new Set(txs.map((item) => item.blockNumber.toString())).size;
    const payload = {
      txCount: txs.length,
      blockCount,
      tps: txs.length / spanSeconds,
      gasTotal: txs.reduce((sum, item) => sum + item.gasUsed, 0n),
      gasP50: BigInt(Math.round(percentile(gasValues, 50))),
      gasP95: BigInt(Math.round(percentile(gasValues, 95))),
      blockTimeAvg: spanSeconds / Math.max(1, blockCount),
      successRate: txs.filter((item) => item.status).length / Math.max(1, txs.length)
    };

    if (kind === "minute") {
      await prisma.metricMinute.upsert({
        where: { bucketStart: bucketDate },
        update: payload,
        create: { bucketStart: bucketDate, ...payload }
      });
    } else {
      await prisma.metricHour.upsert({
        where: { bucketStart: bucketDate },
        update: payload,
        create: { bucketStart: bucketDate, ...payload }
      });
    }
  }
}

async function refreshContractWindows() {
  for (const [window, hours] of [["1h", 1], ["24h", 24], ["7d", 24 * 7]] as const) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const transactions = await prisma.transaction.findMany({
      where: {
        toAddress: { not: null },
        blockTimestamp: { gte: since }
      },
      select: {
        toAddress: true,
        gasUsed: true
      }
    });

    const grouped = new Map<string, { txCount: number; gasTotal: bigint }>();
    for (const transaction of transactions) {
      if (!transaction.toAddress) continue;
      const current = grouped.get(transaction.toAddress) ?? { txCount: 0, gasTotal: 0n };
      current.txCount += 1;
      current.gasTotal += transaction.gasUsed;
      grouped.set(transaction.toAddress, current);
    }

    const top = [...grouped.entries()]
      .sort((a, b) => {
        if (a[1].gasTotal === b[1].gasTotal) return b[1].txCount - a[1].txCount;
        return a[1].gasTotal > b[1].gasTotal ? -1 : 1;
      })
      .slice(0, 500);

    await Promise.all(top.map(([address, values]) =>
      prisma.contractStatWindow.upsert({
        where: {
          window_address: { window, address }
        },
        update: values,
        create: {
          window,
          address,
          ...values
        }
      })
    ));
  }
}
