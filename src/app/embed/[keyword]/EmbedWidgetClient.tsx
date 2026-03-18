"use client";

import Link from "next/link";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

type Props = {
  slug: string;
  title: string;
  sample: string;
  pageUrl: string;
  keyword: string;
};

export function EmbedWidgetClient({ slug, title, sample, pageUrl, keyword }: Props) {
  return (
    <div className="min-h-[200px] bg-slate-50 border border-slate-200 rounded-xl p-5 font-sans text-slate-800">
      <h3 className="text-base font-semibold text-slate-900 mb-2">{keyword} 示例</h3>
      <p className="text-sm text-slate-700 mb-3 line-clamp-2">{sample}</p>
      <div className="flex flex-wrap gap-2 items-center">
        <ZhCopyButton text={sample} label="复制" />
        <Link
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          查看完整指南 →
        </Link>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        来自 ToolEagle · 免费 AI 创作工具
      </p>
    </div>
  );
}
