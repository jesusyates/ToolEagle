"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { clearSignupPending, readSignupPending } from "@/lib/auth/auth-pending-storage";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolvePostLoginPath } from "@/lib/auth/post-login-destination";
import { normalizeAuthEmail, normalizeEmailOtpDigits } from "@tooleagle/auth-system";

export default function SignupVerifyPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pending = readSignupPending();
    if (!pending) {
      router.replace("/signup");
      return;
    }
    setEmail(pending.email);
    setPassword(pending.password);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = normalizeEmailOtpDigits(code);
    if (digits.length < 6) {
      setError("Enter the verification code from your email.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: vErr } = await supabase.auth.verifyOtp({
        email: normalizeAuthEmail(email)!,
        token: digits,
        type: "email"
      });
      if (vErr || !data.session) {
        setLoading(false);
        setError("Invalid or expired code.");
        return;
      }
      const { error: uErr } = await supabase.auth.updateUser({ password });
      if (uErr) {
        setLoading(false);
        setError("Could not set password. Try again.");
        return;
      }
      setLoading(false);
      clearSignupPending();
      await refreshAuth();
      const dest = await resolvePostLoginPath(null, "/dashboard");
      router.replace(dest);
      router.refresh();
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  if (!email) {
    return (
      <main className="min-h-screen bg-page flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-center tracking-tight text-slate-900">Verify your email</h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter the code we sent to <span className="font-medium text-slate-800">{email}</span>.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="sv-code" className="block text-sm font-medium text-slate-700">
                Verification code
              </label>
              <input
                id="sv-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6–8 digit code"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center font-mono text-lg tracking-widest shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                maxLength={8}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Complete sign up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link href="/signup" className="font-medium text-sky-600 hover:underline">
              ← Back
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
