import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler-client";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { logAuthAudit } from "@/lib/auth/auth-audit";
import { getRequestIp, getUserAgent } from "@/lib/auth/request-meta";
import { AUTH_MSG } from "@/lib/auth/auth-errors";
import { isOtpValidFormat, normalizeAuthEmail, normalizeOtpDigits } from "@tooleagle/auth-system";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const ua = getUserAgent(request);
  let email: string | null = null;

  try {
    const body = (await request.json()) as { email?: string; token?: string; next?: string };
    email = normalizeAuthEmail(body.email);
    const token = normalizeOtpDigits(body.token);

    if (!email || !isOtpValidFormat(token)) {
      await logAuthAudit({
        action: "login_otp_verify",
        email,
        ip,
        userAgent: ua,
        status: "rejected"
      });
      return NextResponse.json({ ok: false, error: AUTH_MSG.REQUEST_FAILED }, { status: 400 });
    }

    const rl = checkAuthRateLimit("login_otp_verify", ip, email);
    if (!rl.ok) {
      await logAuthAudit({ action: "login_otp_verify", email, ip, userAgent: ua, status: "rate_limited" });
      return NextResponse.json(
        { ok: false, error: AUTH_MSG.RATE_LIMIT, retryAfter: rl.retryAfterSec },
        { status: 429 }
      );
    }

    const jsonRes = NextResponse.json({ ok: true });
    const supabase = createSupabaseRouteClient(request, jsonRes);

    const { error: vErr } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email"
    });

    if (vErr) {
      await logAuthAudit({ action: "login_otp_verify", email, ip, userAgent: ua, status: "error" });
      return NextResponse.json({ ok: false, error: AUTH_MSG.INVALID_CODE }, { status: 400 });
    }

    await logAuthAudit({ action: "login_otp_verify", email, ip, userAgent: ua, status: "ok" });
    return jsonRes;
  } catch {
    await logAuthAudit({ action: "login_otp_verify", email, ip, userAgent: ua, status: "error" });
    return NextResponse.json({ ok: false, error: AUTH_MSG.GENERIC }, { status: 500 });
  }
}
