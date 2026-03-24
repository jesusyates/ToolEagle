"use client";

import { EnglishHomeLink } from "@/components/locale/EnglishHomeLink";

export function ZhStickyCta() {
  return (
    <aside
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
      aria-label="快捷入口"
    >
      <EnglishHomeLink className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition whitespace-nowrap">
        👉 免费生成爆款内容
      </EnglishHomeLink>
    </aside>
  );
}
