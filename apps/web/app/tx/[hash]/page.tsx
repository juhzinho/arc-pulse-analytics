import Link from "next/link";
import type { Route } from "next";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TransactionDetail = {
  hash: string;
  blockNumber: string;
  blockTimestamp: string;
  fromAddress: string;
  toAddress: string | null;
  status: boolean;
  gasUsed: string;
  gasPrice: string | null;
  effectiveGasPrice: string | null;
  inputSize: number;
  value: string | null;
};

export default async function TransactionDetailPage({
  params
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const transaction = await apiGet<TransactionDetail>(`/v1/tx/${hash}`);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Transaction Detail"
        title="Indexed transaction record and execution context."
        description="Use this page to inspect sender, recipient, execution status, gas footprint and the containing block."
        className="subtle-grid"
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="rounded-[24px] p-5">
          <p className="eyebrow text-ink/46">Status</p>
          <p className="mt-4 text-[1.7rem] font-semibold tracking-[-0.04em] text-ink">{transaction.status ? "Success" : "Failed"}</p>
          <p className="mt-2 text-[0.96rem] text-ink/62">Receipt execution result</p>
        </Card>
        <Card className="rounded-[24px] p-5">
          <p className="eyebrow text-ink/46">Block</p>
          <Link href={`/blocks/${transaction.blockNumber}` as Route} className="mt-4 inline-flex text-[1.7rem] font-semibold tracking-[-0.04em] text-cyan hover:underline">
            #{transaction.blockNumber}
          </Link>
          <p className="mt-2 text-[0.96rem] text-ink/62">{formatDate(transaction.blockTimestamp)}</p>
        </Card>
        <Card className="rounded-[24px] p-5">
          <p className="eyebrow text-ink/46">Gas used</p>
          <p className="metric-value mt-4 text-[2.55rem] font-semibold text-ink">{formatNumber(transaction.gasUsed)}</p>
          <p className="mt-2 text-[0.96rem] text-ink/62">Receipt gas consumed</p>
        </Card>
        <Card className="rounded-[24px] p-5">
          <p className="eyebrow text-ink/46">Input size</p>
          <p className="metric-value mt-4 text-[2.55rem] font-semibold text-ink">{formatNumber(transaction.inputSize)}</p>
          <p className="mt-2 text-[0.96rem] text-ink/62">Bytes of calldata</p>
        </Card>
      </section>

      <Card className="rounded-[24px] p-6">
        <div className="space-y-5">
          <div>
            <p className="eyebrow text-ink/48">Hash</p>
            <p className="mt-3 text-[1rem] font-medium text-ink">{transaction.hash}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="eyebrow text-ink/48">From</p>
              <Link href={`/address?q=${transaction.fromAddress}&window=24h` as Route} className="mt-3 inline-flex text-[1rem] font-medium text-cyan hover:underline">
                {transaction.fromAddress}
              </Link>
            </div>
            <div>
              <p className="eyebrow text-ink/48">To</p>
              {transaction.toAddress ? (
                <Link href={`/address?q=${transaction.toAddress}&window=24h` as Route} className="mt-3 inline-flex text-[1rem] font-medium text-cyan hover:underline">
                  {transaction.toAddress}
                </Link>
              ) : (
                <p className="mt-3 text-[1rem] font-medium text-ink">Contract creation</p>
              )}
            </div>
            <div>
              <p className="eyebrow text-ink/48">Gas price</p>
              <p className="mt-3 text-[1rem] font-medium text-ink">{transaction.gasPrice ? formatNumber(transaction.gasPrice) : "Unavailable"}</p>
            </div>
            <div>
              <p className="eyebrow text-ink/48">Effective gas price</p>
              <p className="mt-3 text-[1rem] font-medium text-ink">{transaction.effectiveGasPrice ? formatNumber(transaction.effectiveGasPrice) : "Unavailable"}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
