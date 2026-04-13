"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGoogleButton } from "@/components/auth/AuthGoogleButton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  isValidAuthEmailFormat,
  normalizeAuthEmail,
  normalizeEmailOtpDigits
} from "@tooleagle/auth-system";
import { resolvePostLoginPath } from "@/lib/auth/post-login-destination";

export function PasswordLoginForm({ defaultNext = "/dashboard" }: { defaultNext?: string }) {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    setOtpMsg(null);
    setUnverified(false);
    setOtpSent(false);

    if (!isValidAuthEmailFormat(email)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setFieldError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const canonicalEmail = normalizeAuthEmail(email)!;
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: canonicalEmail,
        password
      });
      setLoading(false);

      if (!signErr) {
        await refreshAuth();
        const dest = await resolvePostLoginPath(searchParams?.get("next"), defaultNext);
        router.replace(dest);
        router.refresh();
        return;
      }

      const msg = (signErr.message ?? "").toLowerCase();
      const code = (signErr as { code?: string }).code?.toLowerCase() ?? "";
      if (code === "email_not_confirmed" || msg.includes("not confirmed")) {
        setUnverified(true);
        setError("Your account email is not verified yet.");
        return;
      }

      setError("Invalid email or password.");
    } catch {
      setLoading(false);
      setError("Something went wrong. Try again.");
    }
  }

  async function sendVerificationOtp() {
    if (!isValidAuthEmailFormat(email)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setOtpLoading(true);
    setOtpMsg(null);
    try {
      const res = await fetch("/api/auth/email-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      setOtpLoading(false);
      if (res.status === 429) {
        setOtpMsg(j.error ?? "Too many attempts.");
        return;
      }
      if (!res.ok || !j.ok) {
        setOtpMsg(j.error ?? "Could not send code.");
        return;
      }
      setOtpSent(true);
      setOtpMsg("Code sent. Check your email.");
    } catch {
      setOtpLoading(false);
      setOtpMsg("Could not send code.");
    }
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    const digits = normalizeEmailOtpDigits(otpCode);
    if (digits.length < 6) {
      setOtpMsg("Enter the code from your email.");
      return;
    }
    setOtpLoading(true);
    setOtpMsg(null);
    try {
      const supabase = createClient();
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: normalizeAuthEmail(email)!,
        token: digits,
        type: "email"
      });
      setOtpLoading(false);
      if (!vErr) {
        await refreshAuth();
        const dest = await resolvePostLoginPath(searchParams?.get("next"), defaultNext);
        router.replace(dest);
        router.refresh();
        return;
      }
      setOtpMsg("Invalid or expired code.");
    } catch {
      setOtpLoading(false);
      setOtpMsg("Something went wrong.");
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <AuthGoogleButton label="Continue with Google" />

      <div className="my-8 flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="pw-email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="pw-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={unverified && otpSent}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50"
          />
        </div>
        {!unverified ? (
          <div>
            <label htmlFor="pw-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="pw-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        ) : null}

        {fieldError ? <p className="text-sm text-amber-800">{fieldError}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!unverified ? (
          <form onSubmit={onSubmit}>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <div className="rounded-lg border border-sky-200 bg-sky-50/80 p-4 space-y-3">
            <button
              type="button"
              onClick={sendVerificationOtp}
              disabled={otpLoading}
              className="text-sm font-medium text-sky-800 hover:underline disabled:opacity-50"
            >
              {otpLoading && !otpSent ? "Sending…" : "Send verification code"}
            </button>
            {otpMsg ? <p className="text-xs text-slate-700">{otpMsg}</p> : null}
            {otpSent ? (
              <form onSubmit={verifyEmailOtp} className="space-y-2 pt-1">
                <label htmlFor="pw-otp" className="block text-xs font-medium text-slate-700">
                  Verification code
                </label>
                <input
                  id="pw-otp"
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  maxLength={8}
                  placeholder="6–8 digits"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-center font-mono text-sm tracking-widest"
                />
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
                >
                  {otpLoading ? "Verifying…" : "Verify and continue"}
                </button>
              </form>
            ) : null}
          </div>
        )}
      </div>

      <p className="flex flex-wrap justify-center gap-x-6 gap-y-1 pt-6 text-center text-sm text-slate-600">
        <Link href="/signup" className="font-medium text-sky-600 hover:underline">
          Sign up
        </Link>
        <Link href="/reset-password" className="font-medium text-sky-600 hover:underline">
          Forgot password
        </Link>
      </p>
    </div>
  );
}
