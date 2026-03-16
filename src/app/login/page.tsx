"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { DelegatedButton } from "@/components/DelegatedButton";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-sm px-4">
          <h1 className="text-2xl font-semibold text-slate-900 text-center">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-slate-600 text-center">
            Access your saved results and history across devices.
          </p>

          {error && (
            <p className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </p>
          )}

          {sent ? (
            <div className="mt-8 p-4 rounded-2xl border border-sky-200 bg-sky-50 text-center">
              <p className="text-sm font-medium text-sky-800">
                Check your inbox
              </p>
              <p className="mt-1 text-sm text-sky-700">
                We sent a sign-in link to <strong>{email}</strong>
              </p>
              <DelegatedButton
                onClick={() => setSent(false)}
                className="mt-4 text-sm font-medium text-sky-600 hover:underline"
              >
                Use a different email
              </DelegatedButton>
            </div>
          ) : (
            <>
              <DelegatedButton
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 transition duration-150"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
                Continue with Google
              </DelegatedButton>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={handleMagicLink} className="mt-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
                />
                <DelegatedButton
                  onClick={(e) => {
                    const form = (e.target as Element).closest("[data-delegate-click]")?.closest("form");
                    if (form) (form as HTMLFormElement).requestSubmit();
                  }}
                  disabled={loading}
                  className="mt-3 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition duration-150"
                >
                  {loading ? "Sending..." : "Email me a sign-in link"}
                </DelegatedButton>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            By signing in, you agree to our{" "}
            <Link href="/about" className="text-sky-600 hover:underline">
              terms
            </Link>
            .
          </p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white text-slate-900 flex flex-col">
          <SiteHeader />
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
              <p className="mt-2 text-sm text-slate-500">Loading sign-in options...</p>
            </div>
          </div>
          <SiteFooter />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
