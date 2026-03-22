import { BASE_URL } from "@/config/site";
import { ZH } from "@/lib/zh-site/paths";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

function distributionCopyBlocks(hub: string) {
  return {
    reddit: `I’ve been testing a structured Douyin (Chinese TikTok) creator workflow — hooks, scripts, captions, and comment CTAs in one place instead of random prompts. If you’re doing CN short video or researching what actually gets completion + comments, this hub breaks it down by use case (local business, ecommerce, knowledge, etc.):

${hub}

Not affiliated — sharing because the “why it works” notes are more practical than generic AI fluff.`,
    x: `Douyin creators: if your issue is structure (hook → flow → CTA), not “more AI text”, this CN toolkit bundles hooks, topic ideas, captions & comment triggers with “why it works” notes — free preview, Pro for full packs.

→ ${hub}

#shortform #creator #Douyin`,
    quora: `If you’re asking how to write Douyin openings and descriptions that drive comments (not just views), you need a repeatable structure: a strong first 1–2 seconds, a single main point in the middle, and a concrete comment/DM CTA at the end.

I use ToolEagle’s Douyin hub because it outputs those blocks together (hook / script beats / caption / CTA) and explains why each pattern fits Douyin’s completion dynamics — it’s in Chinese and aimed at CN creators: ${hub}`
  };
}

/**
 * V105.2 — Copy-paste blocks for off-site distribution (Reddit / X / Quora), pointing into /zh/douyin.
 */
export function DouyinExternalDistributionBlocks() {
  const hub = `${BASE_URL.replace(/\/$/, "")}${ZH.douyin}`;
  const texts = distributionCopyBlocks(hub);

  return (
    <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/80 p-6" aria-labelledby="v105-ext-dist">
      <h2 id="v105-ext-dist" className="text-lg font-bold text-slate-900">
        外部分发素材（可复制）
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        以下为中性介绍向短文案，用于 Reddit / X / Quora 等；落地页统一指向站内抖音专栏，便于转化与数据归因。
      </p>

      <div className="mt-6 space-y-6 text-sm">
        <div className="rounded-xl border border-orange-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">Reddit（偏讨论 / niche 子版块）</p>
            <ZhCopyButton text={texts.reddit} label="复制全文" className="shrink-0 text-xs py-1" />
          </div>
          <p className="mt-2 text-slate-800 leading-relaxed whitespace-pre-wrap">{texts.reddit}</p>
        </div>

        <div className="rounded-xl border border-sky-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-sky-800 uppercase tracking-wide">X / Twitter</p>
            <ZhCopyButton text={texts.x} label="复制全文" className="shrink-0 text-xs py-1" />
          </div>
          <p className="mt-2 text-slate-800 leading-relaxed whitespace-pre-wrap">{texts.x}</p>
        </div>

        <div className="rounded-xl border border-violet-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-violet-800 uppercase tracking-wide">Quora（问答式）</p>
            <ZhCopyButton text={texts.quora} label="复制全文" className="shrink-0 text-xs py-1" />
          </div>
          <p className="mt-2 text-slate-800 leading-relaxed whitespace-pre-wrap">{texts.quora}</p>
        </div>
      </div>
    </section>
  );
}
