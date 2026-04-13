"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  NON_ADMIN_DEFAULT_POST_LOGIN,
  POST_LOGIN_RESOLVE_SENTINEL,
  resolvePostLoginPath
} from "@/lib/auth/post-login-destination";

type Phase =
  | "idle"
  | "exchanging"
  | "exchange_failed"
  | "checking_account"
  | "signed_in"
  | "missing_code";

function exchangeDoneKey(code: string) {
  return `te_oauth_ex_${code.slice(0, 48)}`;
}

function loginWithGatePath(next: string): string {
  const base = next.startsWith("/zh") ? "/zh/login" : "/login";
  return `${base}?gate=session`;
}

function ClientCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const nextParam = searchParams?.get("next") ?? "";
  const gateNext =
    nextParam === POST_LOGIN_RESOLVE_SENTINEL
      ? nextParam
      : nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : POST_LOGIN_RESOLVE_SENTINEL;

  useEffect(() => {
    if (!searchParams) return;

    const code = searchParams.get("code");

    if (!code) {
      setPhase("missing_code");
      return;
    }

    let cancelled = false;

    async function resolveSuccessDestination(): Promise<string> {
      if (nextParam === POST_LOGIN_RESOLVE_SENTINEL) {
        return resolvePostLoginPath(null, NON_ADMIN_DEFAULT_POST_LOGIN);
      }
      if (nextParam.startsWith("/") && !nextParam.startsWith("//")) {
        return nextParam;
      }
      return resolvePostLoginPath(null, NON_ADMIN_DEFAULT_POST_LOGIN);
    }

    async function afterExchangeNavigateOrFail() {
      setPhase("checking_account");
      const authStatus = await refreshAuth();
      if (cancelled) return;
      if (authStatus === "verified") {
        setPhase("signed_in");
        await new Promise((r) => setTimeout(r, 500));
        if (!cancelled) {
          const dest = await resolveSuccessDestination();
          router.replace(dest);
        }
        return;
      }
      /** Gate failed: clear Supabase session so JWT alone cannot drive “logged-in” UI or API calls. */
      await createClient().auth.signOut();
      await refreshAuth();
      if (!cancelled) router.replace("/onboarding?gate=session");
    }

    if (typeof window !== "undefined" && sessionStorage.getItem(exchangeDoneKey(code)) === "1") {
      void afterExchangeNavigateOrFail();
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      setPhase("exchanging");

      try {
        const supabase = createClient();

        const existing = await supabase.auth.getSession();
        if (cancelled) return;

        if (existing.data.session?.access_token) {
          try {
            sessionStorage.setItem(exchangeDoneKey(code), "1");
          } catch {
            /* ignore */
          }
          await afterExchangeNavigateOrFail();
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (error) {
          setPhase("exchange_failed");
          await new Promise((r) => setTimeout(r, 2000));
          if (!cancelled) router.replace(loginWithGatePath(gateNext));
          return;
        }

        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (cancelled) return;

        if (!session?.access_token) {
          setPhase("exchange_failed");
          await new Promise((r) => setTimeout(r, 2000));
          if (!cancelled) router.replace(loginWithGatePath(gateNext));
          return;
        }

        try {
          sessionStorage.setItem(exchangeDoneKey(code), "1");
        } catch {
          /* ignore */
        }

        await afterExchangeNavigateOrFail();
      } catch {
        if (!cancelled) {
          setPhase("exchange_failed");
          await new Promise((r) => setTimeout(r, 2000));
          if (!cancelled) router.replace(loginWithGatePath(gateNext));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, refreshAuth, nextParam, gateNext]);

  if (phase === "missing_code") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-md font-mono text-sm text-red-600">Missing OAuth code</p>
        <Link href="/login" className="text-sm font-medium text-slate-700 underline">
          Back to login
        </Link>
      </div>
    );
  }

  if (phase === "exchange_failed") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-mono text-sm text-amber-800">Exchanging Google session… failed</p>
        <p className="text-xs text-slate-500">Redirecting to sign-in…</p>
      </div>
    );
  }

  if (phase === "signed_in") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-mono text-sm font-medium text-emerald-800">Signed in</p>
        <p className="text-xs text-slate-500">Continuing…</p>
      </div>
    );
  }

  if (phase === "checking_account") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-mono text-sm text-slate-800">Checking account…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-mono text-sm text-slate-700">Exchanging Google session…</p>
    </div>
  );
}

export default function ClientCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-center font-mono text-sm text-slate-600">
          Exchanging Google session…
        </div>
      }
    >
      <ClientCallbackInner />
    </Suspense>
  );
}
