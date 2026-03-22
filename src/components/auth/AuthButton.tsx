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
 * 跨路由保留登录态，避免顶栏反复卸载/挂载时重复进入 loading 骨架（窄块 → 宽按钮）造成整排导航「收拢」抖动。
 * 背景：`/zh` 下顶栏由 `src/app/zh/layout.tsx` 统一挂载，客户端跳转会重挂载 `AuthButton`。
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
  settingsHref = "/dashboard/settings",
  signOutRedirectTo
}: {
  /** 设置后：登录链接触发 login_click，并带 next=loginNextPath */
  loginAnalyticsSource?: string;
  showSignup?: boolean;
  loginNextPath?: string;
  /** 登录后「账户」入口（与英文站一致，默认工作台） */
  accountHref?: string;
  /** 登录后「个人资料」入口（默认 /dashboard/settings） */
  settingsHref?: string;
  /** 退出登录后跳转（中文站建议 `/zh`） */
  signOutRedirectTo?: string;
} = {}) {
  const t = useTranslations("common");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => (authUserCache === undefined ? null : authUserCache));
  const [loading, setLoading] = useState(() => hasSupabase && authUserCache === undefined);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasSupabase) return;

    const supabase = createClient();

    if (authUserCache === undefined) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        authUserCache = user ?? null;
        setUser(authUserCache);
        setLoading(false);
      });
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authUserCache = session?.user ?? null;
      setUser(authUserCache);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition duration-150"
      onClick={() => emitLoginClick("login")}
    >
      {t("login")}
    </Link>
  );

  if (!hasSupabase) {
    return guestLinks;
  }

  if (loading) {
    return (
      <span
        className="inline-flex h-9 min-w-[7.5rem] items-center justify-center rounded-lg bg-slate-100 animate-pulse"
        aria-hidden
      />
    );
  }

  if (user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-red-50 transition duration-150"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <UserCircle className="h-5 w-5 text-red-700 shrink-0" />
          <span className="max-w-[100px] truncate hidden sm:inline">
            {userDisplayName(user, t("userDisplayFallback"))}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900">
                {userDisplayName(user, t("userDisplayFallback"))}
              </p>
              {user.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
            </div>
            <Link
              href={accountHref}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-red-50"
              onClick={() => setOpen(false)}
            >
              {t("account")}
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
