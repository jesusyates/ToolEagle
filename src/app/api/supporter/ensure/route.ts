import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  applySupporterIdCookie,
  newSupporterId,
  readSupporterIdFromCookieStore
} from "@/lib/supporter/supporter-id";

/** V100.1 — Ensure anonymous supporter cookie exists so perks can attach before first donation. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    return NextResponse.json({ ok: true, mode: "signed_in" as const });
  }

  const existing = readSupporterIdFromCookieStore(request.cookies);
  if (existing) {
    return NextResponse.json({ ok: true, mode: "anonymous" as const });
  }

  const id = newSupporterId();
  const res = NextResponse.json({ ok: true, mode: "anonymous" as const });
  applySupporterIdCookie(res, id);
  return res;
}
