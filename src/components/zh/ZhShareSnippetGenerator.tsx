"use client";

import { ZhCopyButton } from "./ZhCopyButton";

type Props = {
  title: string;
  oneLiner: string;
  pageUrl: string;
  /** Slug for embed URL (e.g. tiktok-zhangfen-ruhe). If not set, extracted from pageUrl. */
  slug?: string;
};

function truncateForTwitter(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

export function ZhShareSnippetGenerator({ title, oneLiner, pageUrl, slug }: Props) {
  const tweet = truncateForTwitter(
    `${title}\n\n${oneLiner}\n\n${pageUrl}`,
    280
  );
  const redditTitle = truncateForTwitter(title, 300);
  const redditBody = `${oneLiner}\n\n来源：${pageUrl}`;
  const linkedIn = `${title}\n\n${oneLiner}\n\n🔗 了解更多：${pageUrl}`;

  const embedSlug = slug ?? pageUrl.replace(/.*\/(zh\/search|zh\/blog)\/([^/]+).*/, "$2");
  const embedUrl = pageUrl.replace(/\/zh\/(search|blog)\/[^/]+.*/, `/embed/${embedSlug}`);
  const iframeCode = `<iframe src="${embedUrl}" width="400" height="200" frameborder="0" title="ToolEagle"></iframe>`;

  return (
    <section className="mt-10 rounded-xl border-2 border-slate-200 bg-slate-50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">分享到社交媒体</h2>
      <p className="text-sm text-slate-600 mb-4">一键复制，分享到 X、Reddit、LinkedIn</p>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">X (Twitter)</h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {tweet}
            </pre>
            <ZhCopyButton text={tweet} label="一键复制" className="shrink-0" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">Reddit 标题</h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {redditTitle}
            </pre>
            <ZhCopyButton text={redditTitle} label="一键复制" className="shrink-0" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">Reddit 正文</h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {redditBody}
            </pre>
            <ZhCopyButton text={redditBody} label="一键复制" className="shrink-0" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">LinkedIn</h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {linkedIn}
            </pre>
            <ZhCopyButton text={linkedIn} label="一键复制" className="shrink-0" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-1">嵌入小工具（获取外链）</h3>
          <p className="text-xs text-slate-500 mb-2">复制以下代码到你的网站，自动获得回链</p>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-xs text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words font-mono">
              {iframeCode}
            </pre>
            <ZhCopyButton text={iframeCode} label="复制" className="shrink-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
