import { z } from "zod";
import { MARKET_METRICS, MARKET_STATUS, MARKET_TYPES, USER_ROLES, WINDOW_OPTIONS } from "./constants";

export const windowSchema = z.enum(WINDOW_OPTIONS);
export const roleSchema = z.enum(USER_ROLES);
export const marketStatusSchema = z.enum(MARKET_STATUS);
export const marketMetricSchema = z.enum(MARKET_METRICS);
export const marketTypeSchema = z.enum(MARKET_TYPES);

export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const summaryQuerySchema = z.object({
  window: windowSchema.default("24h")
});

export const rangeQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  bucket: z.coerce.number().int().positive()
});

export const topContractsQuerySchema = paginationSchema.extend({
  window: windowSchema.default("24h"),
  sort: z.enum(["gas", "tx"]).default("gas"),
  address: addressSchema.optional()
});

export const recentQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const addressSummaryParamsSchema = z.object({
  addr: addressSchema
});

export const blockParamsSchema = z.object({
  number: z.string().regex(/^\d+$/)
});

export const transactionParamsSchema = z.object({
  hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
});

export const addressSummaryQuerySchema = z.object({
  window: windowSchema.default("24h")
});

export const addressActivityQuerySchema = paginationSchema.extend({
  window: windowSchema.optional(),
  direction: z.enum(["in", "out", "all"]).default("all")
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(132)
});

export const marketListQuerySchema = z.object({
  status: marketStatusSchema.optional()
});

export const createMarketSchema = z.object({
  type: marketTypeSchema,
  metric: marketMetricSchema,
  title: z.string().min(5).max(140),
  description: z.string().min(10).max(1000),
  windowStart: z.string().datetime(),
  windowEnd: z.string().datetime(),
  threshold: z.number().optional(),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional()
}).superRefine((value, ctx) => {
  if (value.type === "binary" && typeof value.threshold !== "number") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "threshold is required for binary markets", path: ["threshold"] });
  }
  if (value.type === "range" && (typeof value.lowerBound !== "number" || typeof value.upperBound !== "number")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "lowerBound and upperBound are required for range markets" });
  }
});

export const marketPredictionSchema = z.object({
  choice: z.enum(["YES", "NO"]).optional(),
  value: z.number().optional()
}).superRefine((value, ctx) => {
  if (!value.choice && typeof value.value !== "number") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "choice or value is required" });
  }
});

export const loginSchema = z.object({
  email: z.string().email()
});

export const verifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(10)
});
