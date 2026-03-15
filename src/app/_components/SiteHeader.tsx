"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bird } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";

const navPaths = [
  { href: "/", key: "home" as const },
  { href: "/tools", key: "tools" as const },
  { href: "/favorites", key: "favorites" as const },
  { href: "/dashboard", key: "dashboard" as const },
  { href: "/creator", key: "creator" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/blog", key: "blog" as const },
  { href: "/about", key: "about" as const }
];

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Bird className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900">
              ToolEagle
            </p>
            <p className="text-xs text-slate-600">Free Tools for Creators</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
            <nav className="hidden sm:flex items-center gap-2 text-sm text-slate-700">
            {navPaths.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-full hover:bg-sky-50 hover:text-sky-700 hover:underline transition duration-150"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

