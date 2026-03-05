import Link from "next/link";
import type { Route } from "next";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section-header";
import { AddressSearchForm } from "@/components/address-search-form";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AddressSummary = {
  address: string;
  txCount: number;
  gasTotal: string;
  successRate: number;
  sentTxCount: number;
  receivedTxCount: number;
  contractInteractions: number;
  firstSeen: string | null;
  lastSeen: string | null;
};

type AddressActivity = {
  items: Array<{
    hash: string;
    blockNumber: string;
    status: boolean;
    gasUsed: string;
    blockTimestamp: string;
    fromAddress: string;
    toAddress: string | null;
    direction: "in" | "out";
  }>;
  total: number;
  page: number;
  pageSize: number;
};

type Counterparty = {
  address: string | null;
  txCount: number;
  gasTotal: string;
};

type SearchParams = {
  q?: string;
  page?: string;
  window?: "1h" | "6h" | "24h" | "7d" | "all";
  direction?: "in" | "out" | "all";
};

function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function truncateMiddle(value: string, start = 10, end = 8) {
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export default async function AddressPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const address = params.q?.trim() ?? "";
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const window = params.window ?? "24h";
  const direction = params.direction ?? "all";
  const validAddress = address ? isAddress(address) : false;

  let summary: AddressSummary | null = null;
  let activity: AddressActivity | null = null;
  let counterparties: Counterparty[] = [];

  if (validAddress) {
    [summary, activity, counterparties] = await Promise.all([
      apiGet<AddressSummary>(`/v1/address/${address}/summary?window=${window}`),
      apiGet<AddressActivity>(`/v1/address/${address}/activity?page=${page}&pageSize=20&window=${window}&direction=${direction}`),
      apiGet<Counterparty[]>(`/v1/address/${address}/counterparties?window=${window}`)
    ]);
  }

  const totalPages = activity ? Math.max(1, Math.ceil(activity.total / activity.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Address Intelligence"
        title="Inspect wallets and contracts across Arc testnet activity."
        description="Paste any address to see volume, gas consumption, success rate and the latest indexed transactions touching that account."
        className="subtle-grid"
      />

      <Card className="rounded-[28px]">
        <div className="chrome-line mb-5 pb-5">
          <p className="eyebrow text-ink/48">Lookup</p>
          <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-ink">Wallet and contract search</h2>
          <p className="mt-3 max-w-3xl text-[1rem] leading-7 text-ink/68">
            Data is indexed from Arc Network testnet blocks and transactions. User-facing telemetry is configured so cached reads do not stay stale longer than 30 seconds.
          </p>
        </div>

        <div className="mb-4">
          <AddressSearchForm />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["1h", "6h", "24h", "7d", "all"] as const).map((item) => {
            const href = address ? `/address?q=${address}&window=${item}&direction=${direction}` : `/address?window=${item}&direction=${direction}`;
            const active = item === window;

            return (
              <Link
                key={item}
                href={href as Route}
                className={active ? "surface-pill rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink" : "rounded-full border border-ink/10 px-3 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/60 transition hover:border-cyan/25 hover:text-ink dark:border-white/10 dark:text-white/64 dark:hover:text-white"}
              >
                {item === "all" ? "ALL" : item}
              </Link>
            );
          })}
        </div>
      </Card>

      {!address ? (
        <Card className="rounded-[28px]">
          <p className="text-[1rem] leading-7 text-ink/70">
            Start by pasting a wallet or contract address. The page will show summary metrics, top counterparties and the latest indexed activity on the network.
          </p>
        </Card>
      ) : !validAddress ? (
        <Card className="rounded-[28px]">
          <p className="text-[1rem] leading-7 text-ember">
            Enter a valid EVM address in the format <span className="font-semibold">0x...</span>.
          </p>
        </Card>
      ) : summary && activity ? (
        <>
          <Card className="rounded-[24px] p-5">
            <div className="flex flex-wrap items-center gap-2">
              {([
                ["all", "All activity"],
                ["out", "Sent"],
                ["in", "Received"]
              ] as const).map(([value, label]) => {
                const href = `/address?q=${summary.address}&window=${window}&direction=${value}`;
                const active = direction === value;

                return (
                  <Link
                    key={value}
                    href={href as Route}
                    className={active ? "surface-pill rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink" : "rounded-full border border-ink/10 px-3 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/60 transition hover:border-cyan/25 hover:text-ink dark:border-white/10 dark:text-white/64 dark:hover:text-white"}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </Card>

          <section className="grid gap-4 xl:grid-cols-4">
            <Card className="rounded-[24px] p-5">
              <p className="eyebrow text-ink/46">Address</p>
              <p className="mt-3 text-[1.05rem] font-semibold tracking-[-0.03em] text-ink">{truncateMiddle(summary.address)}</p>
              <p className="mt-2 text-[0.96rem] text-ink/62">Selected window: {window === "all" ? "all-time" : window}</p>
            </Card>
            <Card className="rounded-[24px] p-5">
              <p className="eyebrow text-ink/46">Transactions</p>
              <p className="metric-value mt-4 text-[2.55rem] font-semibold text-ink">{formatNumber(summary.txCount)}</p>
              <p className="mt-2 text-[0.96rem] text-ink/62">
                Sent {formatNumber(summary.sentTxCount)} / Received {formatNumber(summary.receivedTxCount)}
              </p>
            </Card>
            <Card className="rounded-[24px] p-5">
              <p className="eyebrow text-ink/46">Gas used</p>
              <p className="metric-value mt-4 text-[2.55rem] font-semibold text-ink">{formatNumber(summary.gasTotal)}</p>
              <p className="mt-2 text-[0.96rem] text-ink/62">{formatNumber(summary.contractInteractions)} outgoing interactions</p>
            </Card>
            <Card className="rounded-[24px] p-5">
              <p className="eyebrow text-ink/46">Success rate</p>
              <p className="metric-value mt-4 text-[2.55rem] font-semibold text-ink">{formatNumber(summary.successRate * 100)}%</p>
              <p className="mt-2 text-[0.96rem] text-ink/62">
                {summary.lastSeen ? `Last activity ${formatDate(summary.lastSeen)}` : "No indexed activity in this window"}
              </p>
            </Card>
          </section>

          <DataTable
            title="Most used counterparties"
            columns={["Address", "Tx Count", "Gas Used"]}
            rows={counterparties.map((item) => [
              truncateMiddle(item.address ?? "Contract creation", 12, 10),
              formatNumber(item.txCount),
              formatNumber(item.gasTotal)
            ])}
          />

          <DataTable
            title="Recent address activity"
            columns={["Direction", "Hash", "Block", "Counterparty", "Status", "Gas Used", "Timestamp"]}
            rows={activity.items.map((item) => [
              item.direction === "out" ? "Sent" : "Received",
              truncateMiddle(item.hash, 12, 10),
              item.blockNumber,
              truncateMiddle(item.direction === "out" ? item.toAddress ?? "Contract creation" : item.fromAddress, 10, 8),
              item.status ? "Success" : "Failed",
              formatNumber(item.gasUsed),
              formatDate(item.blockTimestamp)
            ])}
          />

          <div className="flex items-center justify-between gap-4 rounded-[20px] border border-ink/8 px-4 py-3 text-[0.96rem] text-ink/68 dark:border-white/8 dark:text-white/68">
            <p>
              Page {activity.page} of {totalPages} · {formatNumber(activity.total)} indexed transactions
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/address?q=${summary.address}&window=${window}&direction=${direction}&page=${Math.max(1, page - 1)}` as Route}
                className={page <= 1 ? "pointer-events-none rounded-[14px] border border-ink/8 px-3 py-2 text-ink/30 dark:border-white/8 dark:text-white/25" : "rounded-[14px] border border-ink/10 px-3 py-2 font-medium text-ink transition hover:border-cyan/25 hover:text-cyan dark:border-white/10 dark:text-white"}
              >
                Previous
              </Link>
              <Link
                href={`/address?q=${summary.address}&window=${window}&direction=${direction}&page=${Math.min(totalPages, page + 1)}` as Route}
                className={page >= totalPages ? "pointer-events-none rounded-[14px] border border-ink/8 px-3 py-2 text-ink/30 dark:border-white/8 dark:text-white/25" : "rounded-[14px] border border-ink/10 px-3 py-2 font-medium text-ink transition hover:border-cyan/25 hover:text-cyan dark:border-white/10 dark:text-white"}
              >
                Next
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
