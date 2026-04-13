import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler-client";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { logAuthAudit } from "@/lib/auth/auth-audit";
import { getRequestIp, getUserAgent } from "@/lib/auth/request-meta";
import { AUTH_MSG } from "@/lib/auth/auth-errors";
import { normalizeAuthEmail, isSupabaseEmailNotConfirmedError } from "@tooleagle/auth-system";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const ua = getUserAgent(request);
  let email: string | null = null;

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = normalizeAuthEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      await logAuthAudit({
        action: "login_attempt",
        email,
        ip,
        userAgent: ua,
        status: "rejected"
      });
      return NextResponse.json({ ok: false, error: AUTH_MSG.INVALID_CREDENTIALS }, { status: 400 });
    }

    const rl = checkAuthRateLimit("login_attempt", ip, email);
    if (!rl.ok) {
      await logAuthAudit({ action: "login_attempt", email, ip, userAgent: ua, status: "rate_limited" });
      return NextResponse.json(
        { ok: false, error: AUTH_MSG.RATE_LIMIT, retryAfter: rl.retryAfterSec },
        { status: 429 }
      );
    }

    const jsonRes = NextResponse.json({ ok: true });
    const supabase = createSupabaseRouteClient(request, jsonRes);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await logAuthAudit({ action: "login_attempt", email, ip, userAgent: ua, status: "error" });
      if (isSupabaseEmailNotConfirmedError(error as { message?: string; code?: string })) {
        return NextResponse.json(
          { ok: false, code: "unverified", error: "Your email is not verified yet. Use a verification code." },
          { status: 401 }
        );
      }
      return NextResponse.json({ ok: false, error: AUTH_MSG.INVALID_CREDENTIALS }, { status: 401 });
    }

    await logAuthAudit({ action: "login_attempt", email, ip, userAgent: ua, status: "ok" });
    return jsonRes;
  } catch {
    await logAuthAudit({ action: "login_attempt", email, ip, userAgent: ua, status: "error" });
    return NextResponse.json({ ok: false, error: AUTH_MSG.GENERIC }, { status: 500 });
  }
}
