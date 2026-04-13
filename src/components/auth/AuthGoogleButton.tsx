"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DelegatedButton } from "@/components/DelegatedButton";
import { createClient } from "@/lib/supabase/client";
import { POST_LOGIN_RESOLVE_SENTINEL } from "@/lib/auth/post-login-destination";

type AuthGoogleButtonProps = {
  /** Shown on the button */
  label: string;
};

/**
 * Google OAuth — same entry for sign-in and sign-up (provider creates the account when new).
 * Add more providers later by mirroring this pattern + a shared layout.
 */
export function AuthGoogleButton({ label }: AuthGoogleButtonProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    // OAuth only starts the flow; AuthProvider + shared-core gate set verified after callback.
    const supabase = createClient();
    const raw = searchParams?.get("next");
    const nextForCallback =
      raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : POST_LOGIN_RESOLVE_SENTINEL;
    /**
     * redirectTo must match Supabase Auth → URL Configuration exactly, e.g.
     * `http://localhost:3000/auth/callback` (no `/auth/callback/client`, same origin/port/http as the app).
     */
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", nextForCallback);
    const callbackUrl = callback.toString();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: false
      }
    });
    setLoading(false);
    if (err) setError(err.message);
  }

  return (
    <div>
      <DelegatedButton
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 transition duration-150"
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? "Connecting…" : label}
      </DelegatedButton>
      {error ? <p className="mt-2 text-center text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
