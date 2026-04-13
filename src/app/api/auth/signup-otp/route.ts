import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { logAuthAudit } from "@/lib/auth/auth-audit";
import { getRequestIp, getUserAgent } from "@/lib/auth/request-meta";
import { verifyTurnstileToken, turnstileRequired } from "@/lib/auth/turnstile";
import { AUTH_MSG } from "@/lib/auth/auth-errors";
import { authUserExistsInSupabase } from "@/lib/auth/supabase-auth-admin";
import { isValidAuthEmailFormat, normalizeAuthEmail } from "@tooleagle/auth-system";

export const runtime = "nodejs";

const ACTION = "signup" as const;

function logSupabaseSendErrorRaw(action: string, err: unknown) {
  try {
    if (err !== null && typeof err === "object") {
      const serialized = JSON.stringify(err, Object.getOwnPropertyNames(err as object));
      console.info(`[auth-otp] supabase_send_error_raw action=${action} error=${serialized}`);
      return;
    }
  } catch {
    /* fall through */
  }
  const ctor =
    err !== null && typeof err === "object" ? err.constructor?.name ?? "Object" : typeof err;
  const keys =
    err !== null && typeof err === "object" ? Object.keys(err as object).join(",") : "";
  const message =
    err !== null && typeof err === "object" && "message" in err
      ? String((err as { message?: unknown }).message)
      : "";
  const code =
    err !== null && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";
  console.info(
    `[auth-otp] supabase_send_error_raw action=${action} fallback ctor=${ctor} keys=${keys} message=${JSON.stringify(message)} code=${JSON.stringify(code)} string=${String(err)}`
  );
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const ip = getRequestIp(request);
  const ua = getUserAgent(request);
  let email: string | null = null;

  console.info(`[auth-otp] start action=${ACTION}`);

  try {
    const body = (await request.json()) as { email?: string; turnstileToken?: string };
    email = normalizeAuthEmail(body.email);
    if (!email || !isValidAuthEmailFormat(email)) {
      await logAuthAudit({
        action: "signup_attempt",
        email: null,
        ip,
        userAgent: ua,
        status: "rejected"
      });
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=rejected_email`);
      return NextResponse.json({ ok: false, error: AUTH_MSG.INVALID_EMAIL }, { status: 400 });
    }

    const rl = checkAuthRateLimit("signup_attempt", ip, email);
    if (!rl.ok) {
      await logAuthAudit({ action: "signup_attempt", email, ip, userAgent: ua, status: "rate_limited" });
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=rate_limited`);
      return NextResponse.json(
        { ok: false, error: AUTH_MSG.RATE_LIMIT, retryAfter: rl.retryAfterSec },
        { status: 429 }
      );
    }

    if (turnstileRequired()) {
      const ok = await verifyTurnstileToken(body.turnstileToken, ip);
      if (!ok) {
        await logAuthAudit({ action: "signup_attempt", email, ip, userAgent: ua, status: "captcha_failed" });
        console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=captcha`);
        return NextResponse.json({ ok: false, error: AUTH_MSG.CAPTCHA }, { status: 400 });
      }
    }

    try {
      const already = await authUserExistsInSupabase(email);
      if (already) {
        await logAuthAudit({
          action: "signup_attempt",
          email,
          ip,
          userAgent: ua,
          status: "rejected"
        });
        console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=email_exists`);
        return NextResponse.json(
          { ok: false, error: AUTH_MSG.SIGNUP_EMAIL_ALREADY_REGISTERED },
          { status: 409 }
        );
      }
    } catch (e) {
      await logAuthAudit({ action: "signup_attempt", email, ip, userAgent: ua, status: "error" });
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=exists_check_failed`);
      return NextResponse.json({ ok: false, error: AUTH_MSG.GENERIC }, { status: 500 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      await logAuthAudit({ action: "signup_attempt", email, ip, userAgent: ua, status: "error" });
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=no_supabase`);
      return NextResponse.json({ ok: false, error: AUTH_MSG.GENERIC }, { status: 500 });
    }

    const sb = createClient(url, key);
    const sendRes = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    const { data: sendData, error } = sendRes;

    if (error) {
      logSupabaseSendErrorRaw(ACTION, error);
      await logAuthAudit({ action: "signup_attempt", email, ip, userAgent: ua, status: "error" });
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} response=otp_send_failed`);
      return NextResponse.json({ ok: false, error: "otp_send_failed" }, { status: 500 });
    }

    console.info(
      `[auth-otp] supabase_send_ok action=${ACTION} user=${sendData?.user ? "1" : "0"} session=${sendData?.session ? "1" : "0"}`
    );
    await logAuthAudit({ action: "signup_attempt", email, ip, userAgent: ua, status: "ok" });
    console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0}`);
    return NextResponse.json({ ok: true });
  } catch {
    await logAuthAudit({
      action: "signup_attempt",
      email,
      ip,
      userAgent: ua,
      status: "error"
    });
    console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=exception`);
    return NextResponse.json({ ok: false, error: AUTH_MSG.GENERIC }, { status: 500 });
  }
}
