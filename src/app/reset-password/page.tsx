"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { TurnstileField } from "@/components/auth/TurnstileField";
import { createClient } from "@/lib/supabase/client";
import { writeResetEmail } from "@/lib/auth/auth-pending-storage";
import {
  isValidAuthEmailFormat,
  normalizeAuthEmail,
  normalizeEmailOtpDigits
} from "@tooleagle/auth-system";

const COUNTDOWN_SEC = 120;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [resendGate, setResendGate] = useState(false);

  const onTs = useCallback((t: string | null) => setTurnstileToken(t), []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function sendCode(isResend: boolean) {
    setError(null);
    setFieldError(null);
    if (!isValidAuthEmailFormat(email)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    if (!isResend && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Complete the verification widget.");
      return;
    }
    if (isResend && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Complete the verification widget to resend.");
      return;
    }

    setSendLoading(true);
    try {
      const canonicalEmail = normalizeAuthEmail(email)!;
      const res = await fetch("/api/auth/reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: canonicalEmail, turnstileToken: turnstileToken ?? undefined })
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      setSendLoading(false);

      if (res.status === 429) {
        setError(j.error ?? "Too many attempts. Please try again later.");
        return;
      }

      if (!res.ok || !j.ok) {
        setError(j.error ?? "Request could not be completed.");
        return;
      }

      setCodeSent(true);
      setCountdown(COUNTDOWN_SEC);
      setOtp("");
      setVerifyError(null);
      setTurnstileToken(null);
      setResendGate(false);
      setTurnstileKey((k) => k + 1);
    } catch {
      setSendLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  async function verifyAndContinue(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError(null);
    const digits = normalizeEmailOtpDigits(otp);
    if (digits.length < 6) {
      setVerifyError("Enter the verification code from your email.");
      return;
    }

    setVerifyLoading(true);
    try {
      const supabase = createClient();
      const canonicalEmail = normalizeAuthEmail(email)!;
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: canonicalEmail,
        token: digits,
        type: "email"
      });
      setVerifyLoading(false);

      if (vErr) {
        setVerifyError("Invalid or expired code.");
        return;
      }

      writeResetEmail(canonicalEmail);
      router.push("/reset-password/confirm");
      router.refresh();
    } catch {
      setVerifyLoading(false);
      setVerifyError("Something went wrong. Please try again.");
    }
  }

  function beginResend() {
    setError(null);
    setResendGate(true);
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-center tracking-tight text-slate-900">Reset password</h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your email. We&apos;ll send a one-time code—no links.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="rp-email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="rp-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={codeSent}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 read-only:bg-slate-50"
              />
            </div>

            {!codeSent ? (
              <>
                <TurnstileField key={turnstileKey} onToken={onTs} />
                {fieldError ? <p className="text-sm text-amber-800">{fieldError}</p> : null}
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <button
                  type="button"
                  disabled={sendLoading}
                  onClick={() => void sendCode(false)}
                  className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
                >
                  {sendLoading ? "Sending…" : "Send code"}
                </button>
              </>
            ) : null}

            {codeSent ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-medium text-emerald-800">
                  We sent a verification code to your email.
                </p>

                <form onSubmit={verifyAndContinue} className="space-y-3">
                  <div>
                    <label htmlFor="rp-otp" className="block text-sm font-medium text-slate-700">
                      Verification code
                    </label>
                    <input
                      id="rp-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      maxLength={8}
                      placeholder="6–8 digits"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center font-mono text-lg tracking-widest shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  {verifyError ? <p className="text-sm text-red-600">{verifyError}</p> : null}
                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
                  >
                    {verifyLoading ? "Verifying…" : "Continue"}
                  </button>
                </form>

                <div className="border-t border-slate-200 pt-3">
                  {countdown > 0 ? (
                    <p className="text-center text-sm text-slate-600">
                      Resend in {countdown}s
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {!resendGate ? (
                        <button
                          type="button"
                          onClick={beginResend}
                          className="w-full text-sm font-medium text-sky-700 hover:underline"
                        >
                          Resend code
                        </button>
                      ) : (
                        <>
                          <TurnstileField key={turnstileKey} onToken={onTs} />
                          {error ? <p className="text-sm text-red-600">{error}</p> : null}
                          <button
                            type="button"
                            disabled={sendLoading}
                            onClick={() => void sendCode(true)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {sendLoading ? "Sending…" : "Send new code"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            <Link href="/login" className="font-medium text-sky-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
