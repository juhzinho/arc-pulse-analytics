import type Redis from "ioredis";

export async function getOrSetJson<T>(
  redis: Redis,
  key: string,
  ttlSeconds: number,
  resolver: () => Promise<T>
) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const value = await resolver();
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  return value;
}
