"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { createClient } from "@/lib/supabase/client";
import { clearResetEmail, readResetEmail } from "@/lib/auth/auth-pending-storage";
import { meetsSignupPasswordPolicy } from "@tooleagle/auth-system";

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.replace("/reset-password");
        return;
      }
      const em = session.user.email ?? readResetEmail() ?? "";
      setEmail(em);
      setReady(true);
    });
  }, [router]);

  function validate(): boolean {
    const errs: string[] = [];
    if (!meetsSignupPasswordPolicy(password)) errs.push("Password must be at least 8 characters.");
    if (password !== confirm) errs.push("Passwords do not match.");
    setFieldErrors(errs);
    return errs.length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: uErr } = await supabase.auth.updateUser({ password });
      if (uErr) {
        setLoading(false);
        setError(uErr.message);
        return;
      }
      await supabase.auth.signOut();
      clearResetEmail();
      setLoading(false);
      router.replace("/login");
      router.refresh();
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  if (!ready) {
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
          <h1 className="text-2xl font-semibold text-center tracking-tight text-slate-900">New password</h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            Signed in as <span className="font-medium text-slate-800">{email}</span>. Choose a new password.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="rc-pw" className="block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                id="rc-pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label htmlFor="rc-cf" className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="rc-cf"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {fieldErrors.length > 0 ? (
              <ul className="list-inside list-disc text-sm text-amber-800">
                {fieldErrors.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link href="/reset-password" className="font-medium text-sky-600 hover:underline">
              ← Back
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
