"use client";

import { ZhCopyButton } from "./ZhCopyButton";

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

type Props = {
  title: string;
  oneLiner: string;
  pageUrl: string;
  keyword: string;
  onPublished?: (platform: "reddit" | "x" | "quora") => void;
};

export function ZhCopySharePack({ title, oneLiner, pageUrl, keyword, onPublished }: Props) {
  const redditTitle = truncate(title, 300);
  const redditBody = `${oneLiner}\n\n来源：${pageUrl}`;
  const redditFull = `标题: ${redditTitle}\n\n正文:\n${redditBody}`;

  const xVersion = truncate(`${title}\n\n${oneLiner}\n\n${pageUrl}`, 280);

  const quoraVersion = `${title}\n\n${oneLiner}\n\n完整指南：${pageUrl}`;

  return (
    <section className="mt-10 rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">🚀 一键分享</h2>
      <p className="text-sm text-slate-600 mb-4">复制后直接粘贴到对应平台发布</p>

      <div className="flex flex-wrap gap-3">
        <ZhCopyButton text={redditFull} label="复制 Reddit 文案" />
        <ZhCopyButton text={xVersion} label="复制 X 文案" />
        <ZhCopyButton text={quoraVersion} label="复制 Quora 文案" />
      </div>

      {onPublished && (
        <div className="mt-4 pt-4 border-t border-amber-200">
          <p className="text-xs text-slate-600 mb-2">发布后点击记录：</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onPublished("reddit")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              我已发布 (Reddit)
            </button>
            <button
              type="button"
              onClick={() => onPublished("x")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              我已发布 (X)
            </button>
            <button
              type="button"
              onClick={() => onPublished("quora")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              我已发布 (Quora)
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
