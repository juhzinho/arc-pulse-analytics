import type { MARKET_METRICS, MARKET_STATUS, MARKET_TYPES, USER_ROLES, WINDOW_OPTIONS } from "./constants";

export type WindowOption = (typeof WINDOW_OPTIONS)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type MarketStatus = (typeof MARKET_STATUS)[number];
export type MarketMetric = (typeof MARKET_METRICS)[number];
export type MarketType = (typeof MARKET_TYPES)[number];

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface SummaryMetric {
  tpsCurrent: number;
  gasTotal24h: string;
  gasP50_24h: string;
  gasP95_24h: string;
  blockTimeAvg1h: number;
}

export interface TimeSeriesPoint {
  bucketStart: string;
  value: number;
}
