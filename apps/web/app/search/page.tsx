import Link from "next/link";
import type { Route } from "next";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
};

type SearchResult =
  | {
      kind: "address";
      address: string;
      summary: {
        address: string;
        txCount: number;
        gasTotal: string;
        successRate: number;
      };
    }
  | {
      kind: "transaction";
      transaction: {
        hash: string;
        blockNumber: string;
        blockTimestamp: string;
        fromAddress: string;
        toAddress: string | null;
        status: boolean;
        gasUsed: string;
      };
    }
  | {
      kind: "block";
      block: {
        number: string;
        hash: string;
        timestamp: string;
        txCount: number;
        gasUsed: string;
        gasLimit: string;
      };
    };

function truncateMiddle(value: string, start = 12, end = 10) {
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export default async function SearchPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  let result: SearchResult | null = null;
  let notFound = false;

  if (query) {
    try {
      result = await apiGet<SearchResult>(`/v1/search?q=${encodeURIComponent(query)}`);
    } catch {
      notFound = true;
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Global Search"
        title="Search by address, transaction hash or block number."
        description="Arc Pulse resolves the query against indexed address activity, transactions and blocks from Arc testnet."
        className="subtle-grid"
      />

      {!query ? (
        <Card className="rounded-[24px] p-6">
          <p className="text-[1rem] leading-7 text-ink/70">Use the search box in the sidebar to jump directly to an indexed address, tx hash or block.</p>
        </Card>
      ) : notFound || !result ? (
        <Card className="rounded-[24px] p-6">
          <p className="text-[1rem] leading-7 text-ink/70">No indexed entity matched <span className="font-semibold text-ink">{query}</span>.</p>
        </Card>
      ) : result.kind === "address" ? (
        <Card className="rounded-[24px] p-6">
          <p className="eyebrow text-ink/48">Address match</p>
          <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.05em] text-ink">{truncateMiddle(result.address, 18, 14)}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Transactions</p>
              <p className="mt-2 text-[1.5rem] font-semibold text-ink">{formatNumber(result.summary.txCount)}</p>
            </div>
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Gas used</p>
              <p className="mt-2 text-[1.5rem] font-semibold text-ink">{formatNumber(result.summary.gasTotal)}</p>
            </div>
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Success rate</p>
              <p className="mt-2 text-[1.5rem] font-semibold text-ink">{formatNumber(result.summary.successRate * 100)}%</p>
            </div>
          </div>
          <Link href={`/address?q=${result.address}&window=24h` as Route} className="mt-6 inline-flex rounded-[16px] bg-cyan px-4 py-2.5 text-[0.96rem] font-semibold text-slate-950">
            Open address view
          </Link>
        </Card>
      ) : result.kind === "transaction" ? (
        <Card className="rounded-[24px] p-6">
          <p className="eyebrow text-ink/48">Transaction match</p>
          <h2 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.05em] text-ink">{truncateMiddle(result.transaction.hash, 18, 14)}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Block</p><p className="mt-2 text-[1.12rem] font-semibold text-ink">{result.transaction.blockNumber}</p></div>
            <div><p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Status</p><p className="mt-2 text-[1.12rem] font-semibold text-ink">{result.transaction.status ? "Success" : "Failed"}</p></div>
            <div><p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Gas used</p><p className="mt-2 text-[1.12rem] font-semibold text-ink">{formatNumber(result.transaction.gasUsed)}</p></div>
            <div><p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Timestamp</p><p className="mt-2 text-[1.12rem] font-semibold text-ink">{formatDate(result.transaction.blockTimestamp)}</p></div>
          </div>
          <div className="mt-6 space-y-3 text-[0.98rem] text-ink/70">
            <p>From: <span className="font-medium text-ink">{truncateMiddle(result.transaction.fromAddress, 18, 14)}</span></p>
            <p>To: <span className="font-medium text-ink">{result.transaction.toAddress ? truncateMiddle(result.transaction.toAddress, 18, 14) : "Contract creation"}</span></p>
          </div>
          <Link href={`/tx/${result.transaction.hash}` as Route} className="mt-6 inline-flex rounded-[16px] bg-cyan px-4 py-2.5 text-[0.96rem] font-semibold text-slate-950">
            Open transaction detail
          </Link>
        </Card>
      ) : (
        <Card className="rounded-[24px] p-6">
          <p className="eyebrow text-ink/48">Block match</p>
          <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.05em] text-ink">Block #{result.block.number}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Transactions</p><p className="mt-2 text-[1.12rem] font-semibold text-ink">{formatNumber(result.block.txCount)}</p></div>
            <div><p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Gas used</p><p className="mt-2 text-[1.12rem] font-semibold text-ink">{formatNumber(result.block.gasUsed)}</p></div>
            <div><p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Gas limit</p><p className="mt-2 text-[1.12rem] font-semibold text-ink">{formatNumber(result.block.gasLimit)}</p></div>
            <div><p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink/48">Timestamp</p><p className="mt-2 text-[1.12rem] font-semibold text-ink">{formatDate(result.block.timestamp)}</p></div>
          </div>
          <p className="mt-6 text-[0.98rem] text-ink/70">Hash: <span className="font-medium text-ink">{truncateMiddle(result.block.hash, 18, 14)}</span></p>
          <Link href={`/blocks/${result.block.number}` as Route} className="mt-6 inline-flex rounded-[16px] bg-cyan px-4 py-2.5 text-[0.96rem] font-semibold text-slate-950">
            Open block detail
          </Link>
        </Card>
      )}
    </div>
  );
}
