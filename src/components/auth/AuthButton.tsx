"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { UserCircle, ChevronDown, LogOut, Settings } from "lucide-react";

const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function displayName(user: User): string {
  const meta = user.user_metadata;
  return meta?.full_name ?? meta?.name ?? meta?.email?.split("@")[0] ?? "User";
}

export function AuthButton() {
  const t = useTranslations("common");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasSupabase);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasSupabase) return;

    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    setOpen(false);
  };

  if (!hasSupabase) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition duration-150"
      >
        {t("login")}
      </Link>
    );
  }

  if (loading) {
    return (
      <span className="h-9 w-20 rounded-lg bg-slate-100 animate-pulse" />
    );
  }

  if (user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:border-sky-300 transition duration-150"
          aria-expanded={open}
          aria-haspopup="true"
        >
          <UserCircle className="h-5 w-5 text-sky-600" />
          <span className="max-w-[120px] truncate">{displayName(user)}</span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900">{displayName(user)}</p>
              {user.email && (
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              )}
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-sky-50"
              onClick={() => setOpen(false)}
            >
              {t("account")}
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-sky-50"
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

  return (
    <Link
      href="/login"
      className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition duration-150"
    >
      {t("login")}
    </Link>
  );
}
