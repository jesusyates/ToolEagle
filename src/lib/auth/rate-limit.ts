/**
 * In-process fixed-window rate limits (best on single Node instance; for multi-instance use Redis/Upstash).
 * Keys are scoped per action + IP or normalized email.
 */

type WindowConfig = { windowMs: number; maxIp: number; maxEmail: number };

export const AUTH_RATE_LIMITS: Record<string, WindowConfig> = {
  signup_attempt: { windowMs: 60 * 60 * 1000, maxIp: 40, maxEmail: 12 },
  signup_verify: { windowMs: 60 * 60 * 1000, maxIp: 60, maxEmail: 24 },
  login_attempt: { windowMs: 15 * 60 * 1000, maxIp: 60, maxEmail: 30 },
  reset_request: { windowMs: 60 * 60 * 1000, maxIp: 15, maxEmail: 6 },
  reset_confirm: { windowMs: 60 * 60 * 1000, maxIp: 40, maxEmail: 16 },
  login_otp_send: { windowMs: 60 * 60 * 1000, maxIp: 24, maxEmail: 12 },
  login_otp_verify: { windowMs: 60 * 60 * 1000, maxIp: 48, maxEmail: 24 }
};

type Bucket = { count: number; windowStart: number };

const store = new Map<string, Bucket>();
const MAX_KEYS = 50_000;

function pruneIfNeeded() {
  if (store.size <= MAX_KEYS) return;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, b] of store) {
    if (b.windowStart < cutoff) store.delete(k);
  }
}

function hit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec?: number } {
  pruneIfNeeded();
  const now = Date.now();
  let b = store.get(key);
  if (!b || now - b.windowStart >= windowMs) {
    b = { count: 0, windowStart: now };
    store.set(key, b);
  }
  if (b.count >= max) {
    const retryAfterSec = Math.ceil((b.windowStart + windowMs - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  b.count += 1;
  return { ok: true };
}

export function checkAuthRateLimit(
  action: keyof typeof AUTH_RATE_LIMITS,
  ip: string,
  emailNorm: string | null
): { ok: boolean; retryAfterSec?: number } {
  const cfg = AUTH_RATE_LIMITS[action];
  if (!cfg) return { ok: true };

  const ipKey = `${String(action)}:ip:${ip}`;
  const ipRes = hit(ipKey, cfg.maxIp, cfg.windowMs);
  if (!ipRes.ok) return ipRes;

  if (emailNorm && emailNorm.length > 0) {
    const em = emailNorm.toLowerCase().slice(0, 320);
    const emKey = `${String(action)}:email:${em}`;
    return hit(emKey, cfg.maxEmail, cfg.windowMs);
  }

  return { ok: true };
}
