"use client";

import Link from "next/link";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

type Props = {
  slug: string;
  title: string;
  sample: string;
  pageUrl: string;
  keyword: string;
  lang?: "zh" | "en";
};

export function EmbedWidgetClient({ slug, title, sample, pageUrl, keyword, lang = "zh" }: Props) {
  const isZh = lang === "zh";
  const sampleLabel = isZh ? `${keyword} 示例` : `${keyword} – Sample`;
  const copyLabel = isZh ? "复制" : "Copy";
  const viewLabel = isZh ? "查看完整指南 →" : "View full guide →";
  const footer = isZh ? "来自 ToolEagle · 免费 AI 创作工具" : "From ToolEagle · Free AI Creator Tools";

  return (
    <div className="min-h-[200px] bg-slate-50 border border-slate-200 rounded-xl p-5 font-sans text-slate-800">
      <h3 className="text-base font-semibold text-slate-900 mb-2">{sampleLabel}</h3>
      <p className="text-sm text-slate-700 mb-3 line-clamp-2">{sample}</p>
      <div className="flex flex-wrap gap-2 items-center">
        <ZhCopyButton text={sample} label={copyLabel} />
        <Link
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          {viewLabel}
        </Link>
      </div>
      <p className="mt-3 text-xs text-slate-500">{footer}</p>
    </div>
  );
}
