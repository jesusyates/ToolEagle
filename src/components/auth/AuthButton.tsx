"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserCircle, ChevronDown, LogOut, Settings } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useAuth, type AuthUiIdentity } from "@/hooks/useAuth";

function identityDisplayName(identity: AuthUiIdentity, fallback: string): string {
  return identity.name ?? identity.email?.split("@")[0] ?? fallback;
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
  const { status, identity, signOutAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [showAdminEntries, setShowAdminEntries] = useState<boolean | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "verified") {
      setShowAdminEntries(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/admin-status", { credentials: "include" });
        const j = (await res.json().catch(() => ({}))) as { admin?: boolean };
        if (!cancelled) setShowAdminEntries(j.admin === true);
      } catch {
        if (!cancelled) setShowAdminEntries(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

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
    await signOutAuth();
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

  if (status === "loading") {
    return (
      <div
        className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-slate-100"
        aria-hidden
      />
    );
  }

  if (status === "verified" && identity) {
    return (
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 transition duration-150 hover:bg-red-50"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <UserCircle className="h-5 w-5 shrink-0 text-red-700" />
          <span className="hidden max-w-[120px] truncate sm:inline">
            {identityDisplayName(identity, t("userDisplayFallback"))}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-[120] mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900">
                {identityDisplayName(identity, t("userDisplayFallback"))}
              </p>
              {identity.email ? <p className="truncate text-xs text-slate-500">{identity.email}</p> : null}
            </div>
            <Link
              href={accountHref}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-red-50"
              onClick={() => setOpen(false)}
            >
              {t("account")}
            </Link>
            {showAdminEntries ? (
              <Link
                href="/admin/seo"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-red-50"
                onClick={() => setOpen(false)}
              >
                SEO内容中心
              </Link>
            ) : null}
            <Link
              href={billingHref}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-red-50"
              onClick={() => setOpen(false)}
            >
              {t("billingNav")}
            </Link>
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
