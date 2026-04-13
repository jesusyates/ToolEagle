"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { AuthGoogleButton } from "@/components/auth/AuthGoogleButton";
import { TurnstileField } from "@/components/auth/TurnstileField";
import { writeSignupPending } from "@/lib/auth/auth-pending-storage";
import {
  isValidAuthEmailFormat,
  meetsSignupPasswordPolicy,
  normalizeAuthEmail
} from "@tooleagle/auth-system";

function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const onTs = useCallback((t: string | null) => setTurnstileToken(t), []);

  function validate(): boolean {
    const errs: string[] = [];
    const canonical = normalizeAuthEmail(email);
    if (!canonical || !isValidAuthEmailFormat(canonical)) {
      errs.push("Enter a valid email address.");
    }
    if (!meetsSignupPasswordPolicy(password)) errs.push("Password must be at least 8 characters.");
    if (password !== confirm) errs.push("Passwords do not match.");
    setFieldErrors(errs);
    return errs.length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Complete the verification widget.");
      return;
    }

    setLoading(true);
    const canonicalEmail = normalizeAuthEmail(email)!;
    try {
      const res = await fetch("/api/auth/signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: canonicalEmail, turnstileToken: turnstileToken ?? undefined })
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      setLoading(false);

      if (!res.ok || !j.ok) {
        setError(j.error ?? "Request could not be completed.");
        return;
      }

      writeSignupPending({ email: canonicalEmail, password });
      router.push("/signup/verify");
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <AuthGoogleButton label="Continue with Google" />

      <div className="my-8 flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4 text-left">
        <p className="text-xs text-slate-600">
          We&apos;ll email you a one-time code to confirm your address—no magic links.
        </p>
        <div>
          <label htmlFor="su-email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="su-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label htmlFor="su-password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="su-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label htmlFor="su-confirm" className="block text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            id="su-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <TurnstileField onToken={onTs} />

        {fieldErrors.length > 0 ? (
          <ul className="list-inside list-disc text-sm text-amber-800">
            {fieldErrors.map((fe) => (
              <li key={fe}>{fe}</li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Sending code…" : "Continue"}
        </button>
      </form>
    </>
  );
}

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-center tracking-tight text-slate-900">Create account</h1>
          <p className="mt-2 text-center text-sm text-slate-600">Sign up with email or Google.</p>

          <div className="mt-8">
            <Suspense fallback={<p className="text-center text-sm text-slate-500">Loading…</p>}>
              <SignupForm />
            </Suspense>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-sky-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
