import Link from "next/link";
import type { Route } from "next";
import { apiGet } from "@/lib/api";
import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section-header";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const response = await apiGet<{ items: Array<{ address: string; txCount: number; gasTotal: string; window: string }> }>("/v1/top/contracts?window=24h&sort=gas&page=1&pageSize=20");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Top Contracts"
        title="Most active contracts across the current ranking window."
        description="Server-side rankings by gas total and transaction count, sourced from aggregate windows maintained by the indexer."
        className="subtle-grid"
      />
      <DataTable
        title="24h contract rankings"
        columns={["Address", "Tx Count", "Gas Total", "Window"]}
        rows={response.items.map((item) => [
          <Link key={item.address} href={`/address?q=${item.address}&window=24h` as Route} className="font-medium text-cyan hover:underline">
            {item.address}
          </Link>,
          formatNumber(item.txCount),
          formatNumber(item.gasTotal),
          item.window
        ])}
      />
    </div>
  );
}
