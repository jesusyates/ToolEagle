"use client";

/**
 * V81: Share Pack Generator - Reddit, X thread, Quora for zh/search + en/how-to
 * "Share this strategy" with copy-ready content
 */

import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

type Props = {
  title: string;
  oneLiner: string;
  pageUrl: string;
  slug: string;
  /** V88: es, pt for future local language templates */
  lang: "zh" | "en" | "es" | "pt";
  onPublished?: (platform: "reddit" | "x" | "quora") => void;
};

export function ShareStrategyBlock({
  title,
  oneLiner,
  pageUrl,
  slug,
  lang,
  onPublished
}: Props) {
  const isZh = lang === "zh";

  // Reddit: discussion style. V90: Include ToolEagle in share content
  const redditTitle = truncate(title, 300);
  const redditBody = isZh
    ? `分享一个我最近在用的方法（via ToolEagle）：\n\n${oneLiner}\n\n完整指南：${pageUrl}`
    : lang === "es"
      ? `Compartiendo un método que he estado usando (via ToolEagle):\n\n${oneLiner}\n\nGuía completa: ${pageUrl}`
      : lang === "pt"
        ? `Compartilhando um método que tenho usado (via ToolEagle):\n\n${oneLiner}\n\nGuia completo: ${pageUrl}`
        : `Sharing a method I've been using (via ToolEagle):\n\n${oneLiner}\n\nFull guide: ${pageUrl}`;

  // X thread: hook + value + CTA (3 tweets max)
  const tweet1 = truncate(`🔥 ${title}`, 280);
  const tweet2 = truncate(oneLiner, 280);
  const tweet3 = truncate(
    isZh ? `完整方法在这里 (ToolEagle) → ${pageUrl}` : lang === "es" ? `Guía completa aquí (ToolEagle) → ${pageUrl}` : lang === "pt" ? `Guia completo aqui (ToolEagle) → ${pageUrl}` : `Full method here (ToolEagle) → ${pageUrl}`,
    280
  );
  const xThread = `${tweet1}\n\n---\n\n${tweet2}\n\n---\n\n${tweet3}`;

  // Quora-style: answer format
  const quoraAnswer = isZh
    ? `根据我的实践（参考 ToolEagle），${oneLiner}\n\n详细步骤和案例可以看这个指南：${pageUrl}`
    : lang === "es"
      ? `Según mi experiencia (via ToolEagle), ${oneLiner}\n\nVer la guía completa con pasos: ${pageUrl}`
      : lang === "pt"
        ? `Com base na minha experiência (via ToolEagle), ${oneLiner}\n\nVeja o guia completo com passos: ${pageUrl}`
        : `Based on my experience (via ToolEagle), ${oneLiner}\n\nSee the full guide with steps: ${pageUrl}`;

  const sectionTitle = isZh ? "分享这个策略" : lang === "es" ? "Compartir esta estrategia" : lang === "pt" ? "Compartilhar esta estratégia" : "Share this strategy";
  const redditLabel = "Reddit";
  const xLabel = "X (Twitter) thread";
  const quoraLabel = "Quora";

  return (
    <section
      className="mt-10 rounded-xl border-2 border-amber-200 bg-amber-50 p-6"
      aria-label={sectionTitle}
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        📤 {sectionTitle}
      </h2>
      <p className="text-sm text-slate-600 mb-4">
        {isZh
          ? "复制后直接粘贴到对应平台发布"
          : lang === "es"
            ? "Copia y pega para compartir en cada plataforma"
            : lang === "pt"
              ? "Copie e cole para compartilhar em cada plataforma"
              : "Copy and paste to share on each platform"}
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">{redditLabel}</h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {`${redditTitle}\n\n${redditBody}`}
            </pre>
            <ZhCopyButton
              text={`${redditTitle}\n\n${redditBody}`}
              label={isZh ? "复制" : "Copy"}
              className="shrink-0"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">{xLabel}</h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {xThread}
            </pre>
            <ZhCopyButton
              text={xThread}
              label={isZh ? "复制" : "Copy"}
              className="shrink-0"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">{quoraLabel}</h3>
          <div className="flex flex-wrap gap-2 items-start">
            <pre className="flex-1 min-w-0 text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
              {quoraAnswer}
            </pre>
            <ZhCopyButton
              text={quoraAnswer}
              label={isZh ? "复制" : "Copy"}
              className="shrink-0"
            />
          </div>
        </div>

        {onPublished && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-xs text-slate-600 mb-2">
              {isZh ? "发布后点击记录：" : "After posting, mark as done:"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onPublished("reddit")}
                className="inline-flex gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {isZh ? "我已发布 (Reddit)" : "Posted (Reddit)"}
              </button>
              <button
                type="button"
                onClick={() => onPublished("x")}
                className="inline-flex gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {isZh ? "我已发布 (X)" : "Posted (X)"}
              </button>
              <button
                type="button"
                onClick={() => onPublished("quora")}
                className="inline-flex gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {isZh ? "我已发布 (Quora)" : "Posted (Quora)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
