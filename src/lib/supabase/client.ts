import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedBrowserClient: SupabaseClient | null = null;

/**
 * Browser Supabase client — must use the same session transport as `/api/auth/*` (cookies).
 * A plain `@supabase/supabase-js` + localStorage client never sees sessions set by route handlers.
 */
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }
  if (typeof window === "undefined") {
    throw new Error("Supabase browser client must run in the browser.");
  }
  if (cachedBrowserClient) {
    return cachedBrowserClient;
  }
  cachedBrowserClient = createBrowserClient(url, key, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    isSingleton: true
  });
  return cachedBrowserClient;
}
