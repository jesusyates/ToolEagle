/**
 * V92: Traffic injection response cache — Upstash Redis when configured, else in-memory TTL.
 */

import { Redis } from "@upstash/redis";

const TTL_SECONDS = 120;
const MEMORY_MAX = 50;

type CacheEntry = { value: string; expires: number };
const memoryStore = new Map<string, CacheEntry>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

const redis = typeof window === "undefined" ? getRedis() : null;

export async function trafficInjectionCacheGet(key: string): Promise<string | null> {
  if (redis) {
    const v = await redis.get<string>(key);
    return v ?? null;
  }
  const hit = memoryStore.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    memoryStore.delete(key);
    return null;
  }
  return hit.value;
}

export async function trafficInjectionCacheSet(key: string, json: string): Promise<void> {
  if (redis) {
    await redis.set(key, json, { ex: TTL_SECONDS });
    return;
  }
  if (memoryStore.size > MEMORY_MAX) {
    const first = memoryStore.keys().next().value;
    if (first) memoryStore.delete(first);
  }
  memoryStore.set(key, { value: json, expires: Date.now() + TTL_SECONDS * 1000 });
}

export function getTrafficInjectionCacheBackend(): "redis" | "memory" {
  if (redis) return "redis";
  return "memory";
}
