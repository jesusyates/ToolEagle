import { Redis } from "@upstash/redis";
import { PROTECTION_CONFIG } from "@/config/protection";

const DAILY_GLOBAL_LIMIT = PROTECTION_CONFIG.globalCostGuard.dailyCreditsLimit;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function ymd() {
  return new Date().toISOString().slice(0, 10);
}

export function globalCreditsKey(date = ymd()): string {
  return `global:credits:used:${date}`;
}

export async function checkGlobalCostGuard(): Promise<{ blocked: boolean; reason?: string }> {
  const redis = getRedis();
  if (!redis) return { blocked: false };
  const raw = await redis.get<number | string>(globalCreditsKey());
  const used = Number(raw ?? 0);
  if (used > DAILY_GLOBAL_LIMIT) {
    return { blocked: true, reason: `global_limit_exceeded:${used}/${DAILY_GLOBAL_LIMIT}` };
  }
  return { blocked: false };
}

export async function incrementGlobalCreditsUsed(credits: number): Promise<void> {
  if (!Number.isFinite(credits) || credits <= 0) return;
  const redis = getRedis();
  if (!redis) return;

  const key = globalCreditsKey();
  const next = await (redis as any).incrby(key, Math.round(credits));
  if (Number(next) === Math.round(credits)) {
    await redis.expire(key, 60 * 60 * 24 * 2);
  }
}

