import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { logAuthAudit } from "@/lib/auth/auth-audit";
import { getRequestIp, getUserAgent } from "@/lib/auth/request-meta";
import { AUTH_MSG } from "@/lib/auth/auth-errors";
import { normalizeAuthEmail } from "@tooleagle/auth-system";

export const runtime = "nodejs";

const ACTION = "login_otp" as const;

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const ip = getRequestIp(request);
  const ua = getUserAgent(request);
  let email: string | null = null;

  console.info(`[auth-otp] start action=${ACTION}`);

  try {
    const body = (await request.json()) as { email?: string };
    email = normalizeAuthEmail(body.email);
    if (!email) {
      await logAuthAudit({
        action: "login_otp_send",
        email: null,
        ip,
        userAgent: ua,
        status: "rejected"
      });
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=rejected_email`);
      return NextResponse.json({ ok: false, error: AUTH_MSG.REQUEST_FAILED }, { status: 400 });
    }

    const rl = checkAuthRateLimit("login_otp_send", ip, email);
    if (!rl.ok) {
      await logAuthAudit({ action: "login_otp_send", email, ip, userAgent: ua, status: "rate_limited" });
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=rate_limited`);
      return NextResponse.json(
        { ok: false, error: AUTH_MSG.RATE_LIMIT, retryAfter: rl.retryAfterSec },
        { status: 429 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      await logAuthAudit({ action: "login_otp_send", email, ip, userAgent: ua, status: "error" });
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=no_supabase`);
      return NextResponse.json({ ok: false, error: AUTH_MSG.GENERIC }, { status: 500 });
    }

    const sb = createClient(url, key);
    const sendRes = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });
    const { data: sendData, error } = sendRes;

    if (error) {
      const code = error.code ?? "";
      const message = error.message ?? "";
      console.info(
        `[auth-otp] supabase_send_error action=${ACTION} code=${code} message=${JSON.stringify(message)}`
      );
      await logAuthAudit({ action: "login_otp_send", email, ip, userAgent: ua, status: "error" });
      console.info(
        `[auth-otp] suppressed_send_error action=${ACTION} message=${JSON.stringify(message)} code=${code}`
      );
      console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} response=ok_true_suppressed`);
      return NextResponse.json({ ok: true });
    }

    console.info(
      `[auth-otp] supabase_send_ok action=${ACTION} user=${sendData?.user ? "1" : "0"} session=${sendData?.session ? "1" : "0"}`
    );
    await logAuthAudit({ action: "login_otp_send", email, ip, userAgent: ua, status: "ok" });
    console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0}`);
    return NextResponse.json({ ok: true });
  } catch {
    await logAuthAudit({ action: "login_otp_send", email, ip, userAgent: ua, status: "error" });
    console.info(`[auth-otp] end action=${ACTION} total_ms=${Date.now() - t0} early=exception`);
    return NextResponse.json({ ok: false, error: AUTH_MSG.GENERIC }, { status: 500 });
  }
}
