"use client";

/**
 * V81: Backlink Trigger - "Creators are using this method"
 * Encourage copying, sharing, embedding with iframe snippet
 */

import { ZhCopyButton } from "@/components/zh/ZhCopyButton";
import { BASE_URL } from "@/config/site";

type Props = {
  slug: string;
  /** Path type: zh/search, en/how-to, etc. Used to build embed URL */
  pathType?: "zh-search" | "en-how-to";
  lang?: "zh" | "en";
};

export function CreatorsUsingBlock({
  slug,
  pathType = "zh-search",
  lang = "zh"
}: Props) {
  const embedUrl =
    pathType === "en-how-to"
      ? `${BASE_URL}/embed/en/how-to/${slug}`
      : `${BASE_URL}/embed/${slug}`;
  const iframeCode = `<iframe src="${embedUrl}" width="400" height="200" frameborder="0" title="ToolEagle"></iframe>`;

  const isZh = lang === "zh";
  const title = isZh ? "创作者都在用这个方法 (ToolEagle)" : "Creators are using this method (ToolEagle)";
  const copyLabel = isZh ? "复制" : "Copy";
  const embedHint = isZh
    ? "复制以下代码到你的网站，自动获得回链（嵌入 ToolEagle 内容）"
    : "Copy this code to your site for a backlink (embed by ToolEagle)";

  return (
    <section
      className="mt-10 rounded-xl border-2 border-sky-200 bg-sky-50 p-6"
      aria-label={title}
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-600 mb-4">
        {isZh
          ? "复制、分享或嵌入 ToolEagle 内容到你的网站，让更多人看到"
          : "Copy, share, or embed ToolEagle content in your site"}
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">
            {isZh ? "嵌入代码" : "Embed snippet"}
          </h3>
          <p className="text-xs text-slate-500 mb-2">{embedHint}</p>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-xs text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words font-mono">
              {iframeCode}
            </pre>
            <ZhCopyButton text={iframeCode} label={copyLabel} className="shrink-0" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">
            {isZh ? "嵌入链接" : "Embed URL"}
          </h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto break-all">
              {embedUrl}
            </pre>
            <ZhCopyButton text={embedUrl} label={copyLabel} className="shrink-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
