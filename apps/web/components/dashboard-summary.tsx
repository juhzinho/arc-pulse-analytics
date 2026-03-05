"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { MetricCard } from "./metric-card";
import { formatNumber } from "@/lib/utils";
import { LiveSummary } from "./live-summary";

interface Summary {
  tpsCurrent: number;
  gasTotal24h: string;
  gasP50_24h: string;
  gasP95_24h: string;
  blockTimeAvg1h: number;
}

export function DashboardSummary({ initialData }: { initialData: Summary }) {
  const { data } = useQuery({
    queryKey: ["summary"],
    queryFn: () => apiGet<Summary>("/v1/metrics/summary?window=24h"),
    initialData,
    refetchInterval: 5000
  });

  return (
    <>
      <LiveSummary />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Current TPS" value={formatNumber(data.tpsCurrent)} detail="Rolling 60s throughput based on minute rollups." href="/methodology" />
        <MetricCard label="Gas Total 24h" value={formatNumber(data.gasTotal24h)} detail="Total gas consumed across hourly aggregates." href="/contracts" />
        <MetricCard label="Gas Median/P95" value={`${formatNumber(data.gasP50_24h)} / ${formatNumber(data.gasP95_24h)}`} detail="Percentile view from 24h rollups." href="/methodology" />
        <MetricCard label="Avg Block Time 1h" value={`${formatNumber(data.blockTimeAvg1h)}s`} detail="Mean block time from the latest rolling hour." href="/methodology" />
      </section>
    </>
  );
}
