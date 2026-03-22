"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { usePathname } from "next/navigation";
import { ZH } from "@/lib/zh-site/paths";
import { isZhToolHubPagePath } from "@/lib/zh-site/zh-tool-routes";

const fabClassName =
  "inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/25 hover:bg-slate-800 ring-2 ring-white/20";

/** 中文工具栈首页（如 /zh/douyin）「打赏」悬浮入口；全局 Pro FAB 已移除。 */
export function FloatingUpgradeCTA() {
  const pathname = usePathname() || "";

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/zh/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/embed") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/zh/dashboard")
  ) {
    return null;
  }

  if (!isZhToolHubPagePath(pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6 print:hidden">
      <Link href={`${ZH.support}#zh-donate`} className={fabClassName}>
        <Heart className="h-4 w-4 shrink-0 text-amber-400 fill-amber-500/25" strokeWidth={2} aria-hidden />
        打赏
      </Link>
    </div>
  );
}
