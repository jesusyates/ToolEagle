import { createHash } from "crypto";
import { Redis } from "@upstash/redis";
import type { RequestIdentity } from "@/lib/request/get-request-identity";
import { PROTECTION_CONFIG } from "@/config/protection";

export type RiskLevel = "low" | "mid" | "high" | "ban";

type DailyUserType = "anonymous" | "free" | "paid";

const BAN_SECONDS = PROTECTION_CONFIG.banSeconds;
const RATE_1S = 1;
const RATE_10S = 10;
const RATE_60S = 60;
const TS_KEEP = 40;
const HASH_KEEP = 20;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function ymd() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function maybeDelay(ms: number): Promise<void> {
  if (ms > 0) await sleep(ms);
}

export async function checkBlockedState(identity: RequestIdentity): Promise<{ blocked: boolean; reason?: string }> {
  const redis = getRedis();
  if (!redis) return { blocked: false };
  const keys = [
    `ban:ip:${identity.ip}`,
    ...(identity.userId ? [`ban:user:${identity.userId}`] : []),
    ...(identity.anonymousId ? [`ban:anon:${identity.anonymousId}`] : [])
  ];
  const vals = await Promise.all(keys.map((k) => redis.get<string>(k)));
  const idx = vals.findIndex((v) => !!v);
  if (idx >= 0) return { blocked: true, reason: keys[idx] };
  return { blocked: false };
}

async function bump(redis: Redis, key: string, expireS: number): Promise<number> {
  const v = await (redis as any).incr(key);
  if (Number(v) === 1) await redis.expire(key, expireS);
  return Number(v);
}

export async function checkRateLimit(identity: RequestIdentity): Promise<{ limited: boolean; rule?: string }> {
  const redis = getRedis();
  if (!redis) return { limited: false };

  if (identity.userId) {
    const id = identity.userId;
    if ((await bump(redis, `rate_limit:user_id:${id}:1s`, RATE_1S)) > PROTECTION_CONFIG.rateLimit.loggedIn.sec1Max) return { limited: true, rule: "1/1s" };
    if ((await bump(redis, `rate_limit:user_id:${id}:10s`, RATE_10S)) > PROTECTION_CONFIG.rateLimit.loggedIn.sec10Max) return { limited: true, rule: "5/10s" };
    if ((await bump(redis, `rate_limit:user_id:${id}:60s`, RATE_60S)) > PROTECTION_CONFIG.rateLimit.loggedIn.sec60Max) return { limited: true, rule: "20/60s" };
    return { limited: false };
  }

  const k = identity.anonymousId ?? identity.ip;
  if ((await bump(redis, `rate_limit:ip:${k}:60s`, RATE_60S)) > PROTECTION_CONFIG.rateLimit.anonymous.sec60Max) return { limited: true, rule: "5/60s" };
  return { limited: false };
}

export async function checkDailyUsageLimit(
  identity: RequestIdentity,
  userType: DailyUserType
): Promise<{ limited: boolean; used: number; limit: number | null }> {
  if (userType === "paid") return { limited: false, used: 0, limit: null };
  const redis = getRedis();
  if (!redis) {
    return {
      limited: false,
      used: 0,
      limit: userType === "anonymous" ? PROTECTION_CONFIG.dailyCreditsLimit.anonymous : PROTECTION_CONFIG.dailyCreditsLimit.freeLoggedIn
    };
  }

  const id = identity.identityKey;
  const key = `usage:daily:${id}:${ymd()}`;
  const used = Number((await redis.get<number | string>(key)) ?? 0);
  const limit =
    userType === "anonymous"
      ? PROTECTION_CONFIG.dailyCreditsLimit.anonymous
      : PROTECTION_CONFIG.dailyCreditsLimit.freeLoggedIn;
  return { limited: used >= limit, used, limit };
}

function normalizeInput(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

function hashInput(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function detectAnomaly(identity: RequestIdentity): Promise<{ detected: boolean; reasons: string[] }> {
  const redis = getRedis();
  if (!redis) return { detected: false, reasons: [] };
  const now = Date.now();
  const keyTs = `risk:ts:${identity.identityKey}`;
  const rows = (await redis.lrange<string>(keyTs, 0, TS_KEEP - 1)) ?? [];
  const ts = rows.map((x) => Number(x)).filter(Number.isFinite);
  const req1m = ts.filter((t) => now - t <= 60_000).length + 1;
  const reasons: string[] = [];
  if (req1m > 10) reasons.push("req_1m_gt_10");
  return { detected: reasons.length > 0, reasons };
}

export async function calculateRiskScore(params: {
  identity: RequestIdentity;
  userInput: string;
  clientRoute?: string;
  userType: DailyUserType;
  anomalyHint?: { detected: boolean; reasons: string[] };
}): Promise<{
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
  anomalyDetected: boolean;
}> {
  const redis = getRedis();
  if (!redis) return { riskScore: 0, riskLevel: "low", reasons: [], anomalyDetected: false };

  const reasons: string[] = [];
  const now = Date.now();
  const identityKey = params.identity.identityKey;
  const sessionKey = identityKey;
  await redis.set(`session:last_seen:${sessionKey}`, String(now), { ex: 7 * 24 * 3600 });
  const first = await redis.get<string>(`session:first_seen:${sessionKey}`);
  if (!first) await redis.set(`session:first_seen:${sessionKey}`, String(now), { ex: 7 * 24 * 3600 });

  const tsKey = `risk:ts:${identityKey}`;
  const hashKey = `risk:inputs:${identityKey}`;
  const prevTs = ((await redis.lrange<string>(tsKey, 0, TS_KEEP - 1)) ?? [])
    .map((x) => Number(x))
    .filter(Number.isFinite);
  const prevHashes = (await redis.lrange<string>(hashKey, 0, HASH_KEEP - 1)) ?? [];
  const normalized = normalizeInput(params.userInput);
  const h = hashInput(normalized);

  const withCurrent = [now, ...prevTs];
  const req10m = withCurrent.filter((t) => now - t <= 10 * 60_000).length;
  let avgInterval = 0;
  if (prevTs.length > 0) {
    const iv = [now - prevTs[0], ...prevTs.slice(0, 8).map((v, i) => v - (prevTs[i + 1] ?? v))];
    avgInterval = iv.reduce((a, b) => a + b, 0) / iv.length;
  }

  const repeated = prevHashes.filter((x) => x.split("|")[0] === h).length + 1;
  const threeConsecutive = prevHashes[0]?.startsWith(h) && prevHashes[1]?.startsWith(h);
  const shortRepeated =
    normalized.split(" ").filter(Boolean).length < 3 &&
    prevHashes.slice(0, 10).filter((x) => x.endsWith("|1")).length >= 3;

  let score = 0;
  if (avgInterval > 0 && avgInterval < 1000) score += 25;
  else if (avgInterval > 0 && avgInterval < 2000) score += 15;
  if (req10m > 50) score += 35;
  else if (req10m > 30) score += 20;
  if (repeated >= 5) score += 20;
  if (threeConsecutive) score += 10;
  if (shortRepeated) score += 10;
  if (!params.clientRoute) score += 15;
  if (params.userType === "anonymous") score += 10;

  const anomaly = params.anomalyHint ?? (await detectAnomaly(params.identity));
  if (anomaly.detected) score += 20;
  reasons.push(...anomaly.reasons);
  if (repeated >= 5) reasons.push("repeat_hash");
  if (threeConsecutive) reasons.push("repeat_3x");
  if (shortRepeated) reasons.push("short_input_repeat");
  if (!params.clientRoute) reasons.push("missing_tool_view_signal");

  await redis.lpush(tsKey, String(now));
  await redis.ltrim(tsKey, 0, TS_KEEP - 1);
  await redis.lpush(hashKey, `${h}|${normalized.split(" ").filter(Boolean).length < 3 ? "1" : "0"}`);
  await redis.ltrim(hashKey, 0, HASH_KEEP - 1);

  const riskScore = clamp(score);
  const riskLevel: RiskLevel = riskScore >= 80 ? "ban" : riskScore >= 60 ? "high" : riskScore >= 30 ? "mid" : "low";
  return { riskScore, riskLevel, reasons, anomalyDetected: anomaly.detected };
}

export async function applyRiskAction(params: {
  identity: RequestIdentity;
  riskScore: number;
}): Promise<{
  allowed: boolean;
  blocked: boolean;
  requireLogin: boolean;
  banApplied: boolean;
  delayMs: number;
  riskDelta: number;
}> {
  const { identity, riskScore } = params;
  if (riskScore < PROTECTION_CONFIG.risk.midThreshold) {
    return { allowed: true, blocked: false, requireLogin: false, banApplied: false, delayMs: 0, riskDelta: 0 };
  }
  if (riskScore < PROTECTION_CONFIG.risk.highThreshold) {
    return {
      allowed: true,
      blocked: false,
      requireLogin: false,
      banApplied: false,
      delayMs:
        PROTECTION_CONFIG.risk.midDelayMinMs +
        Math.floor(Math.random() * Math.max(1, PROTECTION_CONFIG.risk.midDelayMaxMs - PROTECTION_CONFIG.risk.midDelayMinMs)),
      riskDelta: 1
    };
  }
  if (riskScore < PROTECTION_CONFIG.risk.banThreshold) {
    return { allowed: false, blocked: true, requireLogin: true, banApplied: false, delayMs: 0, riskDelta: 2 };
  }

  const redis = getRedis();
  if (redis) {
    if (identity.userId) await redis.set(`ban:user:${identity.userId}`, "1", { ex: BAN_SECONDS });
    if (identity.anonymousId) await redis.set(`ban:anon:${identity.anonymousId}`, "1", { ex: BAN_SECONDS });
    await redis.set(`ban:ip:${identity.ip}`, "1", { ex: BAN_SECONDS });
  }
  return { allowed: false, blocked: true, requireLogin: !identity.userId, banApplied: true, delayMs: 0, riskDelta: 0 };
}

export async function incrementDailyUsage(identity: RequestIdentity, credits: number): Promise<void> {
  const redis = getRedis();
  if (!redis || credits <= 0) return;
  const key = `usage:daily:${identity.identityKey}:${ymd()}`;
  const n = await (redis as any).incrby(key, Math.round(credits));
  if (Number(n) === Math.round(credits)) await redis.expire(key, 60 * 60 * 24 * 2);
}

