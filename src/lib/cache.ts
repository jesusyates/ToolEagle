/**
 * Upstash Redis cache for trending, search, and topic examples.
 * TTL: 10 minutes.
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.
 */

const TTL_SECONDS = 600; // 10 minutes

type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<string>;
};

let redis: RedisClient | null = null;

function getRedis(): RedisClient | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    // eslint-disable-next-line global-require -- dynamic require for optional Redis
    const { Redis } = require("@upstash/redis");
    redis = new Redis({ url, token }) as RedisClient;
    return redis;
  } catch {
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), { ex: TTL_SECONDS });
  } catch {
    // ignore
  }
}

export function cacheKey(type: "trending" | "search" | "topic_examples", ...parts: string[]): string {
  return `te:${type}:${parts.join(":")}`;
}
