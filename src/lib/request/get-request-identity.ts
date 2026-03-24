import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";

export type RequestIdentity = {
  userId: string | null;
  anonymousId: string | null;
  ip: string;
  identityKey: string;
};

function resolveIp(request: NextRequest): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  const xff = request.headers.get("x-forwarded-for")?.trim();
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const xReal = request.headers.get("x-real-ip")?.trim();
  if (xReal) return xReal;

  return "unknown";
}

export async function getRequestIdentity(request: NextRequest): Promise<RequestIdentity> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;
  const anonymousId = readSupporterIdFromCookieStore(request.cookies);
  const ip = resolveIp(request);
  const identityKey = userId ?? anonymousId ?? ip;

  return { userId, anonymousId, ip, identityKey };
}

