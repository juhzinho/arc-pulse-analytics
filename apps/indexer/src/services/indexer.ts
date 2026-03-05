import { chunk } from "@arc-pulse/shared";
import { client } from "../lib/client";
import { prisma } from "../lib/db";
import { logger } from "../lib/logger";
import { batchDurationMs, chainHeadGauge, indexedBlocksTotal, indexedTransactionsTotal, indexerLoopFailuresTotal, lastIndexedBlockGauge } from "../lib/observability";
import { config } from "../config";

export async function runIndexerLoop() {
  while (true) {
    try {
      await indexLatestRange();
    } catch (error) {
      indexerLoopFailuresTotal.inc();
      logger.error({ error }, "indexer loop failed");
      await delay(5000);
    }

    await delay(config.INDEXER_POLL_INTERVAL_MS);
  }
}

async function indexLatestRange() {
  const chainHead = await client.getBlockNumber();
  chainHeadGauge.set(Number(chainHead));
  const safeHead = chainHead - BigInt(config.INDEXER_CONFIRMATIONS);
  const checkpoint = await prisma.indexerState.findUnique({
    where: { id: "arc-main" }
  });

  const initialBlock = config.INDEXER_START_BLOCK
    ?? (safeHead > config.INDEXER_BOOTSTRAP_BLOCKS ? safeHead - config.INDEXER_BOOTSTRAP_BLOCKS : 0n);

  const state = checkpoint ?? await prisma.indexerState.create({
    data: {
      id: "arc-main",
      lastIndexedBlock: initialBlock
    }
  });

  const start = state.lastIndexedBlock + 1n;
  if (start > safeHead) return;

  const blockNumbers = [];
  for (let number = start; number <= safeHead; number += 1n) {
    blockNumbers.push(number);
  }

  for (const batch of chunk(blockNumbers, config.INDEXER_BATCH_SIZE)) {
    const startedAt = performance.now();
    await Promise.all(batch.map((blockNumber) => indexBlock(blockNumber)));
    await prisma.indexerState.update({
      where: { id: "arc-main" },
      data: { lastIndexedBlock: batch[batch.length - 1] }
    });
    lastIndexedBlockGauge.set(Number(batch[batch.length - 1]));
    batchDurationMs.observe(performance.now() - startedAt);
  }
}

async function indexBlock(blockNumber: bigint) {
  const block = await client.getBlock({ blockNumber, includeTransactions: true });
  const receipts = await Promise.all(block.transactions.map((tx) => client.getTransactionReceipt({ hash: tx.hash })));

  await prisma.$transaction(async (tx) => {
    await tx.block.upsert({
      where: { number: block.number },
      update: {
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: new Date(Number(block.timestamp) * 1000),
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
        txCount: block.transactions.length,
        baseFeePerGas: block.baseFeePerGas ?? null
      },
      create: {
        number: block.number,
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: new Date(Number(block.timestamp) * 1000),
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
        txCount: block.transactions.length,
        baseFeePerGas: block.baseFeePerGas ?? null
      }
    });

    for (let index = 0; index < block.transactions.length; index += 1) {
      const transaction = block.transactions[index];
      const receipt = receipts[index];

      await tx.transaction.upsert({
        where: { hash: transaction.hash },
        update: {
          blockNumber: block.number,
          blockTimestamp: new Date(Number(block.timestamp) * 1000),
          fromAddress: transaction.from,
          toAddress: transaction.to,
          status: receipt.status === "success",
          gasUsed: receipt.gasUsed,
          gasPrice: transaction.gasPrice ?? null,
          effectiveGasPrice: receipt.effectiveGasPrice,
          inputSize: (transaction.input.length - 2) / 2,
          value: transaction.value.toString()
        },
        create: {
          hash: transaction.hash,
          blockNumber: block.number,
          blockTimestamp: new Date(Number(block.timestamp) * 1000),
          fromAddress: transaction.from,
          toAddress: transaction.to,
          status: receipt.status === "success",
          gasUsed: receipt.gasUsed,
          gasPrice: transaction.gasPrice ?? null,
          effectiveGasPrice: receipt.effectiveGasPrice,
          inputSize: (transaction.input.length - 2) / 2,
          value: transaction.value.toString()
        }
      });
    }
  });

  indexedBlocksTotal.inc();
  indexedTransactionsTotal.inc(block.transactions.length);
  logger.info({ blockNumber: block.number.toString(), txCount: block.transactions.length }, "indexed block");
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
