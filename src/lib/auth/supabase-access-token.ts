"use client";

import { createClient } from "@/lib/supabase/client";

/** Single credential source for shared-core Bearer: Supabase session access_token. */
export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const { data } = await createClient().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
