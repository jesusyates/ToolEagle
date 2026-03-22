import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function loginUrlWithError(origin: string, next: string) {
  const loginPath = next.startsWith("/zh") ? "/zh/login" : "/login";
  const defaultNext = loginPath === "/zh/login" ? "/zh" : "/dashboard";
  const loginUrl = new URL(loginPath, origin);
  loginUrl.searchParams.set("error", "signin_failed");
  if (next !== defaultNext) loginUrl.searchParams.set("next", next);
  return loginUrl.toString();
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const next = searchParams.get("next") ?? "/dashboard";

  if (errorParam) {
    return NextResponse.redirect(loginUrlWithError(origin, next));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const nextUrl = new URL(next, origin);
      return NextResponse.redirect(nextUrl.toString());
    }
  }

  return NextResponse.redirect(loginUrlWithError(origin, next));
}
