import { NextRequest, NextResponse } from "next/server";
import { POST_LOGIN_RESOLVE_SENTINEL } from "@/lib/auth/post-login-destination";

function loginUrlWithError(origin: string, next: string) {
  const loginPath = next.startsWith("/zh") ? "/zh/login" : "/login";
  const defaultNext = loginPath === "/zh/login" ? "/zh" : "/dashboard";
  const loginUrl = new URL(loginPath, origin);
  loginUrl.searchParams.set("error", "signin_failed");
  const nextForQuery = next === POST_LOGIN_RESOLVE_SENTINEL ? defaultNext : next;
  if (nextForQuery !== defaultNext) loginUrl.searchParams.set("next", nextForQuery);
  return loginUrl.toString();
}

function normalizeOauthNext(nextRaw: string | null): string {
  if (nextRaw === POST_LOGIN_RESOLVE_SENTINEL) return nextRaw;
  if (nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")) return nextRaw;
  return POST_LOGIN_RESOLVE_SENTINEL;
}

/**
 * OAuth lands here first. No server-side exchange — forwards to client page so the browser
 * Supabase client runs `exchangeCodeForSession` and persists session storage/cookies.
 * Dashboard: Auth → URL Configuration must still list `http://localhost:3000/auth/callback` (no trailing slash).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const errorParam = requestUrl.searchParams.get("error");
  const next = normalizeOauthNext(requestUrl.searchParams.get("next"));

  if (errorParam) {
    return NextResponse.redirect(loginUrlWithError(origin, next));
  }

  if (!code) {
    return NextResponse.redirect(loginUrlWithError(origin, next));
  }

  const clientUrl = new URL("/auth/callback/client", origin);
  clientUrl.searchParams.set("code", code);
  clientUrl.searchParams.set("next", next);
  return NextResponse.redirect(clientUrl);
}
