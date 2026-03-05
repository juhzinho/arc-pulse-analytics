import { createHash } from "node:crypto";

export function cacheKey(parts: Array<string | number | undefined>) {
  return parts.filter(Boolean).join(":");
}

export function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}
