import Link from "next/link";
import type { Route } from "next";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section-header";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type BlockDetail = {
  block: {
    number: string;
    hash: string;
    parentHash: string;
    timestamp: string;
    gasUsed: string;
    gasLimit: string;
    txCount: number;
    baseFeePerGas: string | null;
  };
  transactions: Array<{
    hash: string;
    blockNumber: string;
    blockTimestamp: string;
    fromAddress: string;
    toAddress: string | null;
    status: boolean;
    gasUsed: string;
  }>;
};

function truncateMiddle(value: string, start = 12, end = 10) {
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export default async function BlockDetailPage({
  params
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const data = await apiGet<BlockDetail>(`/v1/blocks/${number}`);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Block Detail"
        title={`Block #${data.block.number}`}
        description="Full indexed block detail from Arc testnet, including gas metrics and the latest transactions contained in the block."
        className="subtle-grid"
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="rounded-[24px] p-5">
          <p className="eyebrow text-ink/46">Transactions</p>
          <p className="metric-value mt-4 text-[2.55rem] font-semibold text-ink">{formatNumber(data.block.txCount)}</p>
          <p className="mt-2 text-[0.96rem] text-ink/62">Included in this block</p>
        </Card>
        <Card className="rounded-[24px] p-5">
          <p className="eyebrow text-ink/46">Gas used</p>
          <p className="metric-value mt-4 text-[2.55rem] font-semibold text-ink">{formatNumber(data.block.gasUsed)}</p>
          <p className="mt-2 text-[0.96rem] text-ink/62">Execution consumed</p>
        </Card>
        <Card className="rounded-[24px] p-5">
          <p className="eyebrow text-ink/46">Gas limit</p>
          <p className="metric-value mt-4 text-[2.55rem] font-semibold text-ink">{formatNumber(data.block.gasLimit)}</p>
          <p className="mt-2 text-[0.96rem] text-ink/62">Block capacity</p>
        </Card>
        <Card className="rounded-[24px] p-5">
          <p className="eyebrow text-ink/46">Timestamp</p>
          <p className="mt-4 text-[1.35rem] font-semibold tracking-[-0.04em] text-ink">{formatDate(data.block.timestamp)}</p>
          <p className="mt-2 text-[0.96rem] text-ink/62">Indexed block time</p>
        </Card>
      </section>

      <Card className="rounded-[24px] p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="eyebrow text-ink/48">Hash</p>
            <p className="mt-3 text-[1rem] font-medium text-ink">{data.block.hash}</p>
          </div>
          <div>
            <p className="eyebrow text-ink/48">Parent Hash</p>
            <p className="mt-3 text-[1rem] font-medium text-ink">{data.block.parentHash}</p>
          </div>
          <div>
            <p className="eyebrow text-ink/48">Base Fee</p>
            <p className="mt-3 text-[1rem] font-medium text-ink">{data.block.baseFeePerGas ? formatNumber(data.block.baseFeePerGas) : "Unavailable"}</p>
          </div>
          <div>
            <p className="eyebrow text-ink/48">Search</p>
            <Link href={`/search?q=${data.block.number}` as Route} className="mt-3 inline-flex text-[0.96rem] font-semibold text-cyan">
              Open in global search
            </Link>
          </div>
        </div>
      </Card>

      <DataTable
        title="Transactions in block"
        columns={["Hash", "From", "To", "Status", "Gas Used"]}
        rows={data.transactions.map((transaction) => [
          <Link key={transaction.hash} href={`/tx/${transaction.hash}` as Route} className="font-medium text-cyan hover:underline">
            {truncateMiddle(transaction.hash, 12, 10)}
          </Link>,
          <Link key={`${transaction.hash}-from`} href={`/address?q=${transaction.fromAddress}&window=24h` as Route} className="text-ink/78 hover:text-cyan">
            {truncateMiddle(transaction.fromAddress)}
          </Link>,
          transaction.toAddress ? (
            <Link key={`${transaction.hash}-to`} href={`/address?q=${transaction.toAddress}&window=24h` as Route} className="text-ink/78 hover:text-cyan">
              {truncateMiddle(transaction.toAddress)}
            </Link>
          ) : (
            "Contract creation"
          ),
          transaction.status ? "Success" : "Failed",
          formatNumber(transaction.gasUsed)
        ])}
      />
    </div>
  );
}
