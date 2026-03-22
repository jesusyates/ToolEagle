"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ZhPlatformSubNavItem = {
  href: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  /** 用于 aria，如「抖音」 */
  platformLabel: string;
  items: ZhPlatformSubNavItem[];
};

function normalizePath(p: string) {
  return (p.replace(/\/$/, "") || "/") as string;
}

function isSubNavActive(pathname: string, href: string): boolean {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (h === "/zh/douyin") {
    return p === "/zh/douyin";
  }
  return p === h || p.startsWith(`${h}/`);
}

/**
 * 平台分区二级导航：工具 / 教程 / 工作台 等，与主导航「平台」对应。
 */
export function ZhPlatformSubNav({ platformLabel, items }: Props) {
  const pathname = normalizePath(usePathname() || "");

  return (
    <nav
      className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-red-50/30"
      aria-label={`${platformLabel} 分区导航`}
    >
      <div className="container max-w-6xl px-4 py-2.5 flex flex-wrap gap-2">
        {items.map((item) => {
          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="inline-flex items-center rounded-full border border-dashed border-slate-200 bg-white/60 px-3.5 py-1.5 text-sm text-slate-400 cursor-not-allowed"
              >
                {item.label}
                <span className="ml-1.5 text-[10px] font-bold uppercase text-amber-600">soon</span>
              </span>
            );
          }
          const active = isSubNavActive(pathname, item.href);

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={
                active
                  ? "inline-flex rounded-full bg-red-700 px-3.5 py-1.5 text-sm font-bold text-white shadow-sm"
                  : "inline-flex rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-900 transition"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
