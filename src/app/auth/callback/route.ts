import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const next = searchParams.get("next") ?? "/dashboard";

  if (errorParam) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "signin_failed");
    if (next !== "/dashboard") loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl.toString());
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const nextUrl = new URL(next, origin);
      return NextResponse.redirect(nextUrl.toString());
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "signin_failed");
  if (next !== "/dashboard") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl.toString());
}
