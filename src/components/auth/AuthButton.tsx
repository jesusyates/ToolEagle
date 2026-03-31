"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { UserCircle, ChevronDown, LogOut, Settings } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * 跨路由保留登录态，避免顶栏反复卸载/挂载时重复请求。
 */
let authUserCache: User | null | undefined;

function userDisplayName(user: User, fallback: string): string {
  const meta = user.user_metadata;
  return meta?.full_name ?? meta?.name ?? meta?.email?.split("@")[0] ?? fallback;
}

export function AuthButton({
  loginAnalyticsSource,
  showSignup = false,
  loginNextPath = "/zh",
  accountHref = "/dashboard",
  billingHref = "/dashboard/billing",
  settingsHref = "/dashboard/settings",
  signOutRedirectTo
}: {
  loginAnalyticsSource?: string;
  showSignup?: boolean;
  loginNextPath?: string;
  accountHref?: string;
  billingHref?: string;
  settingsHref?: string;
  signOutRedirectTo?: string;
} = {}) {
  const t = useTranslations("common");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => (authUserCache === undefined ? null : authUserCache));
  const [open, setOpen] = useState(false);
  const [creditsSummary, setCreditsSummary] = useState<{ remaining: number; total: number } | null>(null);
  const lowCredits = (creditsSummary?.remaining ?? 0) > 0 && (creditsSummary?.remaining ?? 0) < 20;
  const veryLowCredits = (creditsSummary?.remaining ?? 0) > 0 && (creditsSummary?.remaining ?? 0) < 8;

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasSupabase) return;

    const supabase = createClient();

    if (authUserCache === undefined) {
      supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          authUserCache = user ?? null;
          setUser(authUserCache);
        })
        .catch(() => {
          authUserCache = null;
          setUser(null);
        });
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authUserCache = session?.user ?? null;
      setUser(authUserCache);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setCreditsSummary(null);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch("/api/credits/balance", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        setCreditsSummary({
          remaining: Number(json?.remaining_credits ?? json?.remaining ?? 0),
          total: Number(json?.total_credits ?? json?.totalCredits ?? 0)
        });
      } catch {
        if (!cancelled) setCreditsSummary(null);
      }
    };
    void load();
    const timer = setInterval(load, 45000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    authUserCache = null;
    setOpen(false);
    if (signOutRedirectTo) {
      router.push(signOutRedirectTo);
      router.refresh();
    } else {
      router.refresh();
    }
  };

  const loginBase =
    loginAnalyticsSource && loginNextPath?.startsWith("/zh") ? "/zh/login" : "/login";
  const loginHref =
    loginAnalyticsSource && loginNextPath
      ? `${loginBase}?next=${encodeURIComponent(loginNextPath)}`
      : "/login";

  function emitLoginClick(kind: "login" | "register" | "register_or_login") {
    if (!loginAnalyticsSource) return;
    trackEvent("login_click", { source: loginAnalyticsSource, kind });
  }

  const guestLinks = showSignup ? (
    <Link
      href={loginHref}
      className="inline-flex items-center rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition duration-150"
      onClick={() => emitLoginClick("register_or_login")}
    >
      注册/登录
    </Link>
  ) : (
    <Link
      href={loginHref}
      className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition duration-150"
      onClick={() => emitLoginClick("login")}
    >
      {t("login")}
    </Link>
  );

  if (!hasSupabase) {
    return guestLinks;
  }

  if (user) {
    return (
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition duration-150 ${
            veryLowCredits
              ? "border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100"
              : lowCredits
                ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                : "border border-red-200 bg-white text-slate-700 hover:bg-red-50"
          }`}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <UserCircle className="h-5 w-5 text-red-700 shrink-0" />
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="max-w-[120px] truncate">{userDisplayName(user, t("userDisplayFallback"))}</span>
            {creditsSummary ? (
              <span className={`text-[11px] font-semibold ${veryLowCredits ? "text-rose-700" : lowCredits ? "text-amber-700" : "text-emerald-700"}`}>
                {t("creditsCompact", {
                  remaining: creditsSummary.remaining,
                  total: creditsSummary.total
                })}
              </span>
            ) : null}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-[120] mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900">
                {userDisplayName(user, t("userDisplayFallback"))}
              </p>
              {user.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
              {creditsSummary ? (
                <p className="truncate text-xs text-emerald-700 mt-1">
                  {t("creditsLine", {
                    remaining: creditsSummary.remaining,
                    total: creditsSummary.total
                  })}
                </p>
              ) : null}
              {lowCredits ? (
                <p className={`text-xs mt-1 ${veryLowCredits ? "text-rose-700" : "text-amber-700"}`}>
                  {veryLowCredits ? t("creditsVeryLowWarning") : t("creditsLowWarning")}
                </p>
              ) : null}
            </div>
            <Link
              href={accountHref}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-red-50"
              onClick={() => setOpen(false)}
            >
              {t("account")}
            </Link>
            <Link
              href={billingHref}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-red-50"
              onClick={() => setOpen(false)}
            >
              {t("billingNav")}
            </Link>
            {lowCredits ? (
              <Link
                href={loginNextPath.startsWith("/zh") ? "/zh/pricing" : "/pricing"}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                onClick={() => setOpen(false)}
              >
                {loginNextPath.startsWith("/zh") ? "低余额，去购买" : "Low credits, top up"}
              </Link>
            ) : null}
            <Link
              href={settingsHref}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-red-50"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4" />
              {t("profile")}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return guestLinks;
}
