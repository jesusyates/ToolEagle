"use client";

import { ZhCopyButton } from "./ZhCopyButton";

type Props = {
  title: string;
  oneLiner: string;
  pageUrl: string;
  /** Optional: Reddit-style body (more natural, less marketing) */
  redditBody?: string;
};

export function ZhRedditReadyBlock({
  title,
  oneLiner,
  pageUrl,
  redditBody
}: Props) {
  const body =
    redditBody ||
    `${oneLiner}\n\n来源：${pageUrl}`;

  return (
    <section className="mt-10 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        适合发 Reddit 的版本
      </h2>
      <p className="text-sm text-slate-600 mb-4">
        更自然、无营销感的表述，适合 Reddit 社区分享
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">标题</h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {title}
            </pre>
            <ZhCopyButton text={title} label="复制" className="shrink-0" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">正文</h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {body}
            </pre>
            <ZhCopyButton text={body} label="复制" className="shrink-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
