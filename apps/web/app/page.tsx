import Link from "next/link";
import type { Route } from "next";
import { apiGet } from "@/lib/api";
import { TpsChart, GasChart } from "@/components/charts";
import { DataTable } from "@/components/data-table";
import { DashboardSummary } from "@/components/dashboard-summary";
import { SectionHeader } from "@/components/section-header";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

function truncateMiddle(value: string, start = 10, end = 8) {
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

async function getDashboardData() {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const [summary, tps, gas, blocks, txs] = await Promise.all([
    apiGet<{ tpsCurrent: number; gasTotal24h: string; gasP50_24h: string; gasP95_24h: string; blockTimeAvg1h: number }>("/v1/metrics/summary?window=24h"),
    apiGet<Array<{ bucketStart: string; value: number }>>(`/v1/metrics/tps?from=${sixHoursAgo}&to=${now.toISOString()}&bucket=60`),
    apiGet<Array<{ bucketStart: string; value: number }>>(`/v1/metrics/gas?from=${dayAgo}&to=${now.toISOString()}&bucket=3600`),
    apiGet<Array<{ number: string; timestamp: string; txCount: number; gasUsed: string }>>("/v1/blocks/recent?limit=10"),
    apiGet<Array<{ hash: string; blockNumber: string; status: boolean; gasUsed: string; toAddress?: string | null }>>("/v1/tx/recent?limit=10")
  ]);

  return { summary, tps, gas, blocks, txs };
}

export default async function DashboardPage() {
  const { summary, tps, gas, blocks, txs } = await getDashboardData();

  return (
    <div className="space-y-6">
      <section className="panel-shell hero-grid rounded-[28px] p-5 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="relative z-10">
            <p className="eyebrow">Arc Network Testnet</p>
            <h2 className="title-display mt-3 max-w-4xl text-[2.1rem] font-semibold text-ink sm:text-[3.35rem]">
              Serious network analytics for gas, throughput and forecasting.
            </h2>
            <p className="mt-5 max-w-2xl text-[1.04rem] leading-8 text-ink/70 sm:text-[1.09rem]">
              Low-latency telemetry, cached API reads, rollup-backed summaries and measurable forecast resolution against on-chain network behavior.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {["SSE live metrics", "Postgres aggregates", "Redis cache", "Automatic resolution"].map((item) => (
                <span key={item} className="surface-pill rounded-full px-3 py-1.5 text-[0.73rem] font-semibold uppercase tracking-[0.08em] text-ink/68">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="relative z-10 grid gap-3 sm:grid-cols-2">
            <div className="surface-card rounded-[22px] p-4 text-white sm:p-5">
              <p className="text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-white/60">TPS now</p>
              <p className="metric-value mt-5 text-[2.7rem] font-semibold sm:text-[3.2rem]">{formatNumber(summary.tpsCurrent)}</p>
              <p className="mt-3 text-[1rem] text-white/74">Rolling 60s throughput</p>
            </div>
            <div className="surface-card-muted rounded-[22px] p-4 sm:p-5">
              <p className="text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-ink/56">Block time</p>
              <p className="metric-value mt-5 text-[2.7rem] font-semibold text-ink sm:text-[3.2rem]">{formatNumber(summary.blockTimeAvg1h)}s</p>
              <p className="mt-3 text-[1rem] text-ink/68">Latest 1h average</p>
            </div>
            <div className="surface-card-muted rounded-[22px] p-4 sm:col-span-2 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-ink/56">Gas consumed</p>
                  <p className="metric-value mt-4 text-[2.5rem] font-semibold text-ink sm:text-[3rem]">{formatNumber(summary.gasTotal24h)}</p>
                </div>
                <div className="surface-pill rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink/62">
                  24h window
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionHeader
        eyebrow="Overview"
        title="Network summary, recent chain activity and telemetry windows."
        description="All values shown below come directly from indexed blocks, transactions and aggregate tables refreshed by the backend workers."
      />

      <DashboardSummary initialData={summary} />

      <section className="grid gap-4 xl:grid-cols-2">
        <TpsChart data={tps} />
        <GasChart data={gas} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DataTable
          title="Recent Blocks"
          columns={["Block", "Timestamp", "Tx Count", "Gas Used"]}
          rows={blocks.map((block) => [
            <Link key={block.number} href={`/blocks/${block.number}` as Route} className="font-medium text-cyan hover:underline">
              #{block.number}
            </Link>,
            formatDate(block.timestamp),
            formatNumber(block.txCount),
            formatNumber(block.gasUsed)
          ])}
        />
        <DataTable
          title="Recent Transactions"
          columns={["Hash", "Block", "Status", "Gas Used"]}
          rows={txs.map((tx) => [
            <Link key={tx.hash} href={`/tx/${tx.hash}` as Route} className="font-medium text-cyan hover:underline">
              {truncateMiddle(tx.hash)}
            </Link>,
            <Link key={`${tx.hash}-block`} href={`/blocks/${tx.blockNumber}` as Route} className="text-ink/78 hover:text-cyan">
              #{tx.blockNumber}
            </Link>,
            tx.status ? "Success" : "Failed",
            formatNumber(tx.gasUsed)
          ])}
        />
      </section>
    </div>
  );
}
