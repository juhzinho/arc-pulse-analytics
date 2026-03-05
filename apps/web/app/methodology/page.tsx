import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";

const items = [
  {
    title: "TPS",
    body: "Transactions per second are computed from indexed transactions and minute aggregates. The dashboard card shows the latest available rolling minute."
  },
  {
    title: "Gas distribution",
    body: "Median and p95 gas use are derived from rollup tables to keep summary reads fast and stable under load."
  },
  {
    title: "Forecast scoring",
    body: "Binary markets use Brier score, while numeric markets use absolute error. Lower score indicates stronger forecasting quality."
  },
  {
    title: "Resolution",
    body: "Markets resolve from Postgres aggregate tables after the market window closes. No off-chain price feeds are used."
  }
];

export default function MethodologyPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Methodology"
        title="How metrics and forecasting outcomes are calculated."
        description="The product only exposes values derived from indexed Arc testnet data, aggregate rollups and deterministic market resolution rules."
        className="subtle-grid"
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <Card key={item.title} className="rounded-[24px] p-5 sm:p-6">
            <h3 className="text-[1.34rem] font-semibold tracking-[-0.04em] text-ink sm:text-[1.5rem]">{item.title}</h3>
            <p className="mt-4 text-[1rem] leading-8 text-ink/66">{item.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
