"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DelegatedButton } from "@/components/DelegatedButton";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { createClient } from "@/lib/supabase/client";
import { useAuthBroadcast, broadcastAuthFailed } from "@/components/auth/AuthSuccessBroadcast";

const POLL_INTERVAL_MS = 500;
const RESEND_WAIT_SEC = 120;
const LINK_EXPIRY_MS = RESEND_WAIT_SEC * 1000;

function LoginForm() {
  const t = useTranslations("loginPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const urlError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    if (urlError === "signin_failed") {
      setError(t("linkExpiredInvalid"));
      broadcastAuthFailed();
      try {
        document.cookie = "te_auth_failed=1; max-age=10; path=/";
      } catch {
        // ignore
      }
    }
  }, [urlError, t]);

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(next);
    });
  }, [next, router]);
  const [status, setStatus] = useState<"waiting" | "success" | "expired">("waiting");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const sentAtRef = useRef<number>(0);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    setRateLimited(false);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setStatus("waiting");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });
    setLoading(false);
    if (error) {
      const isRateLimit = /rate limit|too many|rate_limit/i.test(error.message);
      setRateLimited(isRateLimit);
      setError(isRateLimit ? t("rateLimitMessage") : error.message);
    } else {
      setSent(true);
      setRateLimited(false);
      sentAtRef.current = Date.now();
      setCountdown(RESEND_WAIT_SEC);
    }
  }

  async function handleResend() {
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setStatus("waiting");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });
    setLoading(false);
    if (error) {
      const isRateLimit = /rate limit|too many|rate_limit/i.test(error.message);
      setRateLimited(isRateLimit);
      setError(isRateLimit ? t("rateLimitMessage") : error.message);
    } else {
      sentAtRef.current = Date.now();
      setStatus("waiting");
      setCountdown(RESEND_WAIT_SEC);
      setOtpCode("");
    }
  }

  function clearError() {
    setError(null);
    setRateLimited(false);
  }

  useEffect(() => {
    if (!sent || status !== "waiting" || countdown === null || countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((c) => (c !== null && c > 1 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [sent, status, countdown]);

  useEffect(() => {
    if (countdown === 0 && status === "waiting") setStatus("expired");
  }, [countdown, status]);

  const handleAuthSuccess = useCallback(() => {
    setStatus("success");
    setCountdown(null);
    setTimeout(() => router.replace(next), 1500);
  }, [next, router]);

  const handleAuthFailed = useCallback(() => {
    setError(t("linkExpiredInvalid"));
    setSent(false);
    setStatus("waiting");
    setCountdown(null);
  }, [t]);

  useAuthBroadcast(handleAuthSuccess, handleAuthFailed);

  useEffect(() => {
    if (!sent || status !== "waiting") return;
    const supabase = createClient();

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("success");
        setCountdown(null);
        setTimeout(() => router.replace(next), 1500);
        return true;
      }
      try {
        const r = await fetch("/api/auth-status", { credentials: "include" });
        const data = await r.json();
        if (data.status === "failed") {
          handleAuthFailed();
          return true;
        }
      } catch {
        // ignore
      }
      if (Date.now() - sentAtRef.current > LINK_EXPIRY_MS) {
        setStatus("expired");
        setCountdown(null);
        return true;
      }
      return false;
    };

    const id: ReturnType<typeof setInterval> = setInterval(
      () => check().then((done) => done && clearInterval(id)),
      POLL_INTERVAL_MS
    );
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      if (s) {
        setStatus("success");
        setCountdown(null);
        setTimeout(() => router.replace(next), 1500);
      }
    });

    const onVisible = () => check();
    const onFocus = () => check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(id);
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [sent, status, next, router, handleAuthFailed]);

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otpCode.replace(/\D/g, "").slice(0, 8);
    if (code.length < 6 || code.length > 8) return;
    setOtpLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email"
    });
    setOtpLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setStatus("success");
      setCountdown(null);
      setTimeout(() => router.replace(next), 1500);
    }
  }

  function resetEmail() {
    setSent(false);
    setStatus("waiting");
    setError(null);
    setCountdown(null);
    setOtpCode("");
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-sm px-4">
          <h1 className="text-2xl font-semibold text-slate-900 text-center">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 text-center">
            {t("subtitle")}
          </p>

          {error && (
            <div className={`mt-4 p-4 rounded-xl ${rateLimited ? "bg-amber-50 border border-amber-200" : "bg-red-50"} text-sm`}>
              <p className={rateLimited ? "text-amber-800" : "text-red-700"}>{error}</p>
              {!rateLimited && (
                <DelegatedButton onClick={clearError} className="mt-2 text-xs text-slate-500 hover:text-slate-700 underline">
                  Dismiss
                </DelegatedButton>
              )}
              {rateLimited && (
                <DelegatedButton
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t("signInWithGoogle")}
                </DelegatedButton>
              )}
              {rateLimited && (
                <DelegatedButton onClick={clearError} className="mt-2 text-xs text-slate-500 hover:text-slate-700">
                  {t("tryEmailLater")}
                </DelegatedButton>
              )}
            </div>
          )}

          {sent ? (
            <div className="mt-8 p-5 rounded-2xl border border-sky-200 bg-sky-50/80 text-center">
              {status === "success" ? (
                <>
                  <p className="text-sm font-medium text-green-700">{t("verificationSuccess")}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("loggingIn")}</p>
                </>
              ) : status === "expired" ? (
                <>
                  <p className="text-sm text-slate-600">{t("sentTo", { email })}</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="mt-3 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                  >
                    {loading ? t("sending") : t("resend")}
                  </button>
                  <DelegatedButton onClick={resetEmail} className="mt-3 text-sm text-sky-600 hover:underline">
                    {t("useDifferentEmail")}
                  </DelegatedButton>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-sky-800">{t("sent")}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t("sentTo", { email })}
                  </p>
                  {countdown !== null && countdown > 0 && (
                    <p className="mt-2 text-lg font-mono font-medium text-sky-700 tabular-nums">
                      {`${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, "0")}`}
                    </p>
                  )}
                  <form onSubmit={handleVerifyOtp} className="mt-4">
                    <p className="text-xs text-slate-500 mb-2">{t("enterCode")}</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="00000000"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-xl tracking-[0.3em] font-mono text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
                    />
                    <button
                      type="submit"
                      disabled={otpCode.replace(/\D/g, "").length < 6 || otpLoading}
                      className="mt-3 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpLoading ? t("verifying") : t("verify")}
                    </button>
                  </form>
                  <DelegatedButton onClick={resetEmail} className="mt-3 text-sm text-sky-600 hover:underline">
                    {t("useDifferentEmail")}
                  </DelegatedButton>
                </>
              )}
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

              <form onSubmit={handleSendLink} className="mt-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 transition duration-150"
                >
                  {loading ? t("sending") : t("emailMeLink")}
                </button>
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
