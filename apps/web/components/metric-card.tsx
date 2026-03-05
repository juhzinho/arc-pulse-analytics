import Link from "next/link";
import type { Route } from "next";
import { Card } from "./ui/card";

export function MetricCard({
  label,
  value,
  detail,
  href
}: {
  label: string;
  value: string;
  detail: string;
  href?: Route;
}) {
  const content = (
    <Card className="min-h-[184px] rounded-[24px] transition hover:border-cyan/20 hover:shadow-[0_12px_30px_rgba(8,145,178,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[0.77rem] font-semibold uppercase tracking-[0.08em] text-ink/50">{label}</p>
        <span className="surface-pill rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink/64">
          Rolling
        </span>
      </div>
      <p className="metric-value mt-7 text-[2.8rem] font-semibold text-ink sm:text-[3.1rem]">{value}</p>
      <p className="mt-5 max-w-[26ch] text-[1rem] leading-7 text-ink/68">{detail}</p>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
