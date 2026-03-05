import { apiGet } from "@/lib/api";
import { AuthPanel } from "@/components/auth-panel";
import { MarketActions } from "@/components/market-actions";
import { SectionHeader } from "@/components/section-header";
import { Card } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ForecastsPage() {
  const markets = await apiGet<Array<{
    id: string;
    type: "binary" | "range";
    title: string;
    description: string;
    metric: string;
    threshold?: number | null;
    status: string;
    windowEnd: string;
  }>>("/v1/markets?status=open");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Forecast Markets"
        title="Outcome-based markets tied to measurable network performance."
        description="Users forecast future Arc testnet metrics and are scored against resolved aggregate outcomes, not external feeds."
      />
      <AuthPanel />
      <div className="grid gap-4 xl:grid-cols-2">
        {markets.map((market) => (
          <Card key={market.id} className="rounded-[24px] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="eyebrow text-ink/44">{market.metric}</p>
              <span className="w-fit rounded-full border border-ink/10 bg-slate-50 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-ink/56 dark:bg-white/5 dark:text-white/64">
                {market.status}
              </span>
            </div>
            <h3 className="mt-4 text-[1.35rem] font-semibold tracking-[-0.04em] sm:text-[1.5rem]">{market.title}</h3>
            <p className="mt-3 text-[1rem] leading-7 text-ink/64">{market.description}</p>
            <div className="mt-6 flex flex-col gap-2 border-t border-ink/8 pt-4 text-[0.98rem] text-ink/58 sm:flex-row sm:items-center sm:justify-between">
              <span>Ends {formatDate(market.windowEnd)}</span>
              <span>{market.threshold ? `Threshold ${formatNumber(market.threshold)}` : market.status}</span>
            </div>
            <div className="mt-6">
              <MarketActions marketId={market.id} type={market.type} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
