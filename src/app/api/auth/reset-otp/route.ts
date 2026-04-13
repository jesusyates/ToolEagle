import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { logAuthAudit } from "@/lib/auth/auth-audit";
import { getRequestIp, getUserAgent } from "@/lib/auth/request-meta";
import { verifyTurnstileToken, turnstileRequired } from "@/lib/auth/turnstile";
import { AUTH_MSG } from "@/lib/auth/auth-errors";
import { normalizeAuthEmail } from "@tooleagle/auth-system";

export const runtime = "nodejs";

const ACTION = "reset" as const;

/** Best-effort: OTP to non-existent account when shouldCreateUser is false (anti-enum still; logs only). */
function resetLikelyNonexistentAccount(err: { code?: string; message?: string }): boolean {
  const c = String(err.code ?? "");
  const m = String(err.message ?? "").toLowerCase();
  if (c === "user_not_found") return true;
  if (/(not registered|no user|user not found|does not exist|unknown user|email not found)/i.test(m)) return true;
  return false;
}

function normEmail(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const ip = getRequestIp(request);
  const ua = getUserAgent(request);
  let email: string | null = null;

  console.info("[reset-otp] start");
  console.info(`[auth-otp] start action=${ACTION}`);

  try {
    const body = (await request.json()) as { email?: string; turnstileToken?: string };
    email = normalizeAuthEmail(body.email);
    if (!email) {
      await logAuthAudit({
        action: "reset_request",
        email: null,
        ip,
        userAgent: ua,
        status: "rejected"
      });
      console.info(`[reset-otp] end total_ms=${Date.now() - t0} early=rejected_email`);
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=rejected_email`);
      return NextResponse.json({ ok: false, error: AUTH_MSG.REQUEST_FAILED }, { status: 400 });
    }

    const rl = checkAuthRateLimit("reset_request", ip, email);
    console.info(`[reset-otp] rate_limit_done ms=${Date.now() - t0}`);
    if (!rl.ok) {
      await logAuthAudit({ action: "reset_request", email, ip, userAgent: ua, status: "rate_limited" });
      console.info(`[reset-otp] end total_ms=${Date.now() - t0} early=rate_limited`);
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=rate_limited`);
      return NextResponse.json(
        { ok: false, error: AUTH_MSG.RATE_LIMIT, retryAfter: rl.retryAfterSec },
        { status: 429 }
      );
    }

    if (turnstileRequired()) {
      const ok = await verifyTurnstileToken(body.turnstileToken, ip);
      console.info(`[reset-otp] turnstile_done ms=${Date.now() - t0}`);
      if (!ok) {
        await logAuthAudit({ action: "reset_request", email, ip, userAgent: ua, status: "captcha_failed" });
        console.info(`[reset-otp] end total_ms=${Date.now() - t0} early=captcha`);
        console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=captcha`);
        return NextResponse.json({ ok: false, error: AUTH_MSG.CAPTCHA }, { status: 400 });
      }
    } else {
      console.info(`[reset-otp] turnstile_done ms=${Date.now() - t0} skipped=1`);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      await logAuthAudit({ action: "reset_request", email, ip, userAgent: ua, status: "error" });
      console.info(`[reset-otp] end total_ms=${Date.now() - t0} early=no_supabase`);
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=no_supabase`);
      return NextResponse.json({ ok: false, error: AUTH_MSG.GENERIC }, { status: 500 });
    }

    const sb = createClient(url, key);
    const sendRes = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });
    const { data: sendData, error } = sendRes;
    console.info(`[reset-otp] otp_send_done ms=${Date.now() - t0}`);

    if (error) {
      const code = error.code ?? "";
      const message = error.message ?? "";
      console.info(
        `[auth-otp] supabase_send_error action=${ACTION} code=${code} message=${JSON.stringify(message)}`
      );
      if (resetLikelyNonexistentAccount(error)) {
        console.info(`[auth-otp] skipped_send_nonexistent_account action=${ACTION}`);
      }
      await logAuthAudit({ action: "reset_request", email, ip, userAgent: ua, status: "error" });
      console.info(`[reset-otp] audit_done ms=${Date.now() - t0}`);
      console.info(
        `[auth-otp] suppressed_send_error action=${ACTION} message=${JSON.stringify(message)} code=${code}`
      );
      console.info(`[reset-otp] end total_ms=${Date.now() - t0} ok=1 suppressed_error=1`);
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} response=ok_true_suppressed`);
      return NextResponse.json({ ok: true });
    }

    console.info(
      `[auth-otp] supabase_send_ok action=${ACTION} user=${sendData?.user ? "1" : "0"} session=${sendData?.session ? "1" : "0"}`
    );
    await logAuthAudit({ action: "reset_request", email, ip, userAgent: ua, status: "ok" });
    console.info(`[reset-otp] audit_done ms=${Date.now() - t0}`);
    console.info(`[reset-otp] end total_ms=${Date.now() - t0}`);
    console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0}`);
    return NextResponse.json({ ok: true });
  } catch {
    await logAuthAudit({ action: "reset_request", email, ip, userAgent: ua, status: "error" });
    console.info(`[reset-otp] end total_ms=${Date.now() - t0} early=exception`);
    console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=exception`);
    return NextResponse.json({ ok: false, error: AUTH_MSG.GENERIC }, { status: 500 });
  }
}
