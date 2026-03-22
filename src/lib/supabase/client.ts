import { createBrowserClient } from "@supabase/ssr";
import type { LockFunc } from "@supabase/auth-js";

/**
 * Default Web Locks + steal recovery in gotrue-js can surface as:
 * AbortError: Lock broken by another request with the 'steal' option
 * (React Strict Mode double-mount, HMR, fast unmount). See supabase/issues/42505.
 * A no-op lock matches GoTrueClient's built-in fallback when LockManager is unavailable.
 */
const browserAuthLock: LockFunc = async (_name, _acquireTimeout, fn) => await fn();

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }
  return createBrowserClient(url, key, {
    auth: {
      lock: browserAuthLock
    }
  });
}
