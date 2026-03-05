import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";

dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url))
});

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/arc_pulse";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.ARC_RPC_URL ??= "https://rpc.testnet.arc.network";

export const config = z.object({
  ARC_RPC_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  METRICS_PORT: z.coerce.number().default(9100),
  INDEXER_BATCH_SIZE: z.coerce.number().default(25),
  INDEXER_CONFIRMATIONS: z.coerce.number().default(2),
  INDEXER_POLL_INTERVAL_MS: z.coerce.number().default(5000),
  INDEXER_START_BLOCK: z.coerce.bigint().optional(),
  INDEXER_BOOTSTRAP_BLOCKS: z.coerce.bigint().default(5000n)
}).parse(process.env);
