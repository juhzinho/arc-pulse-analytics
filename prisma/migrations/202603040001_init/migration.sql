CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "MarketType" AS ENUM ('binary', 'range');
CREATE TYPE "MarketMetric" AS ENUM ('tps', 'gas_total', 'block_time', 'top_contract');
CREATE TYPE "MarketStatus" AS ENUM ('open', 'resolved', 'cancelled');
CREATE TYPE "PredictionChoice" AS ENUM ('YES', 'NO');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE TABLE "MagicLinkToken" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT
);

CREATE UNIQUE INDEX "MagicLinkToken_tokenHash_key" ON "MagicLinkToken"("tokenHash");
CREATE INDEX "MagicLinkToken_email_idx" ON "MagicLinkToken"("email");
CREATE INDEX "MagicLinkToken_expiresAt_idx" ON "MagicLinkToken"("expiresAt");

CREATE TABLE "Block" (
  "number" BIGINT PRIMARY KEY NOT NULL,
  "hash" TEXT NOT NULL,
  "parentHash" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "gasUsed" BIGINT NOT NULL,
  "gasLimit" BIGINT NOT NULL,
  "txCount" INTEGER NOT NULL,
  "baseFeePerGas" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Block_hash_key" ON "Block"("hash");
CREATE INDEX "Block_timestamp_idx" ON "Block"("timestamp");

CREATE TABLE "Transaction" (
  "hash" TEXT PRIMARY KEY NOT NULL,
  "blockNumber" BIGINT NOT NULL,
  "blockTimestamp" TIMESTAMP(3) NOT NULL,
  "fromAddress" TEXT NOT NULL,
  "toAddress" TEXT,
  "status" BOOLEAN NOT NULL,
  "gasUsed" BIGINT NOT NULL,
  "gasPrice" BIGINT,
  "effectiveGasPrice" BIGINT,
  "inputSize" INTEGER NOT NULL,
  "value" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Transaction_blockNumber_idx" ON "Transaction"("blockNumber");
CREATE INDEX "Transaction_blockTimestamp_idx" ON "Transaction"("blockTimestamp");
CREATE INDEX "Transaction_fromAddress_idx" ON "Transaction"("fromAddress");
CREATE INDEX "Transaction_toAddress_idx" ON "Transaction"("toAddress");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

CREATE TABLE "MetricMinute" (
  "bucketStart" TIMESTAMP(3) PRIMARY KEY NOT NULL,
  "txCount" INTEGER NOT NULL,
  "blockCount" INTEGER NOT NULL,
  "tps" DOUBLE PRECISION NOT NULL,
  "gasTotal" BIGINT NOT NULL,
  "gasP50" BIGINT NOT NULL,
  "gasP95" BIGINT NOT NULL,
  "blockTimeAvg" DOUBLE PRECISION NOT NULL,
  "successRate" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "MetricMinute_bucketStart_idx" ON "MetricMinute"("bucketStart");

CREATE TABLE "MetricHour" (
  "bucketStart" TIMESTAMP(3) PRIMARY KEY NOT NULL,
  "txCount" INTEGER NOT NULL,
  "blockCount" INTEGER NOT NULL,
  "tps" DOUBLE PRECISION NOT NULL,
  "gasTotal" BIGINT NOT NULL,
  "gasP50" BIGINT NOT NULL,
  "gasP95" BIGINT NOT NULL,
  "blockTimeAvg" DOUBLE PRECISION NOT NULL,
  "successRate" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "MetricHour_bucketStart_idx" ON "MetricHour"("bucketStart");

CREATE TABLE "ContractStatWindow" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "window" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "txCount" INTEGER NOT NULL,
  "gasTotal" BIGINT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "ContractStatWindow_window_address_key" ON "ContractStatWindow"("window", "address");
CREATE INDEX "ContractStatWindow_window_txCount_idx" ON "ContractStatWindow"("window", "txCount" DESC);
CREATE INDEX "ContractStatWindow_window_gasTotal_idx" ON "ContractStatWindow"("window", "gasTotal" DESC);
CREATE INDEX "ContractStatWindow_address_idx" ON "ContractStatWindow"("address");

CREATE TABLE "Market" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "type" "MarketType" NOT NULL,
  "metric" "MarketMetric" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "windowEnd" TIMESTAMP(3) NOT NULL,
  "threshold" DOUBLE PRECISION,
  "lowerBound" DOUBLE PRECISION,
  "upperBound" DOUBLE PRECISION,
  "status" "MarketStatus" NOT NULL DEFAULT 'open',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Market_status_windowEnd_idx" ON "Market"("status", "windowEnd");
CREATE INDEX "Market_metric_status_idx" ON "Market"("metric", "status");

CREATE TABLE "Prediction" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "marketId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "choice" "PredictionChoice",
  "value" DOUBLE PRECISION,
  "score" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Prediction_marketId_userId_key" ON "Prediction"("marketId", "userId");
CREATE INDEX "Prediction_userId_createdAt_idx" ON "Prediction"("userId", "createdAt");

CREATE TABLE "MarketResult" (
  "marketId" TEXT PRIMARY KEY NOT NULL,
  "resolvedValue" DOUBLE PRECISION NOT NULL,
  "outcome" TEXT NOT NULL,
  "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LeaderboardSnapshot" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "period" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "accuracy" DOUBLE PRECISION NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "LeaderboardSnapshot_period_userId_key" ON "LeaderboardSnapshot"("period", "userId");
CREATE INDEX "LeaderboardSnapshot_period_score_idx" ON "LeaderboardSnapshot"("period", "score" DESC);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "ip" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

CREATE TABLE "IndexerState" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "lastIndexedBlock" BIGINT NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "Block"("number") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Market" ADD CONSTRAINT "Market_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketResult" ADD CONSTRAINT "MarketResult_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
