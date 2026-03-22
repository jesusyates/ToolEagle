/**
 * V102.1 — Douyin-native pattern library (not EN TikTok translations).
 * V102.2 — Expanded niches, SEO-rich examples, conversion hooks (涨粉/爆款/转化).
 */

import {
  DOUYIN_HOOK_EXAMPLES,
  DOUYIN_CAPTION_PATTERNS,
  DOUYIN_CTA_LINES,
  DOUYIN_SCRIPT_BEATS,
  type DouyinNiche
} from "@/lib/zh-site/douyin-example-library";

type Variant = "hub" | "caption" | "hook" | "script";

type Props = { variant: Variant };

const NICHE_ORDER: DouyinNiche[] = ["带货", "情绪共鸣", "干货知识", "个人IP", "娱乐类"];

function nicheBadgeClass(n: DouyinNiche): string {
  const map: Record<DouyinNiche, string> = {
    带货: "bg-rose-100 text-rose-900",
    情绪共鸣: "bg-violet-100 text-violet-900",
    干货知识: "bg-amber-100 text-amber-950",
    个人IP: "bg-sky-100 text-sky-900",
    娱乐类: "bg-emerald-100 text-emerald-900"
  };
  return map[n];
}

export function DouyinExamplePatterns({ variant }: Props) {
  const hooks = DOUYIN_HOOK_EXAMPLES;
  const captions = DOUYIN_CAPTION_PATTERNS;
  const scriptBeats = DOUYIN_SCRIPT_BEATS;

  if (variant === "hook") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">抖音钩子示例（按赛道拆，可直接改词开拍）</h2>
          <p className="mt-1 text-xs text-slate-600">
            每条附：<span className="font-semibold text-red-800">为什么这个开头能爆</span>、
            <span className="font-semibold text-red-800">用这个文案涨粉案例</span>——方便你对标同类账号。
          </p>
        </div>
        <ul className="space-y-4">
          {hooks.map((h, i) => (
            <li key={i} className="text-sm border-l-4 border-red-400 pl-3 text-slate-800">
              <p className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${nicheBadgeClass(h.niche)}`}>
                  {h.niche}
                </span>
              </p>
              <p className="font-medium text-slate-900 mt-1">{h.text}</p>
              <p className="mt-1.5 text-xs text-slate-700">
                <span className="font-semibold text-red-900">为什么这个开头能爆：</span>
                {h.whyExplodes}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">用这个文案涨粉案例：</span>
                {h.growthCase}
              </p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (variant === "caption") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">抖音描述区文案结构（与口播对齐）</h2>
          <p className="mt-1 text-xs text-slate-600">
            公式 + 示例 + <span className="font-semibold text-red-800">转化/互动提示</span>；复制后按你的人设改词即可发。
          </p>
        </div>
        <ul className="space-y-3 text-sm text-slate-800">
          {captions.map((c, i) => (
            <li key={i} className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <p className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${nicheBadgeClass(c.niche)}`}>
                  {c.niche}
                </span>
              </p>
              <p className="text-xs font-semibold text-red-900">{c.pattern}</p>
              <p className="mt-2 text-slate-700">{c.example}</p>
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">转化提示：</span>
                {c.convertTip}
              </p>
            </li>
          ))}
        </ul>
        <div>
          <p className="text-xs font-bold text-slate-800 mb-2">引导评论 / 私信（高互动句式）</p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            {DOUYIN_CTA_LINES.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  if (variant === "script") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">口播骨架（按镜头推进 · 多赛道）</h2>
          <p className="mt-1 text-xs text-slate-600">
            每一段附 <span className="font-semibold text-red-800">为什么这段能拉完播/转化</span>，方便你剪气口与加字幕。
          </p>
        </div>
        <ol className="space-y-3">
          {scriptBeats.map((s, i) => (
            <li key={i} className="text-sm flex gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <span className="font-bold text-red-800 shrink-0">{i + 1}.</span>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{s.beat}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${nicheBadgeClass(s.niche)}`}>
                    {s.niche}
                  </span>
                </span>
                <p className="text-slate-600 text-xs mt-0.5">{s.hint}</p>
                <p className="text-xs text-slate-700 mt-1">
                  <span className="font-semibold text-red-900">为什么能爆：</span>
                  {s.whyWorks}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  /* hub — condensed + niche index */
  const hookByNiche = NICHE_ORDER.map((n) => ({
    niche: n,
    sample: hooks.find((h) => h.niche === n) ?? hooks[0]
  }));

  return (
    <section className="rounded-2xl border-2 border-red-100 bg-gradient-to-br from-red-50/90 to-amber-50/40 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">抖音内容模式库（节选 · 五大赛道）</h2>
        <p className="mt-1 text-sm text-slate-600">
          带货 / 情绪 / 干货 / 个人 IP / 娱乐——下面各挑一条「能直接改」的钩子；完整模板见各工具页上方示例区。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hookByNiche.map(({ niche, sample }) => (
          <div key={niche} className="rounded-xl bg-white/90 border border-slate-200 p-4">
            <p className={`text-[10px] font-bold inline-block px-2 py-0.5 rounded-full ${nicheBadgeClass(niche)}`}>
              {niche}
            </p>
            <p className="mt-2 text-sm text-slate-800 leading-snug">{sample.text}</p>
            <p className="mt-2 text-[11px] text-slate-600 line-clamp-2">
              <span className="font-semibold text-red-900">为什么能爆：</span>
              {sample.whyExplodes}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white/90 border border-slate-200 p-4">
          <p className="text-xs font-bold text-red-900 uppercase tracking-wide">文案公式示例</p>
          <p className="mt-2 text-sm text-slate-800">{captions[0].example}</p>
          <p className="mt-2 text-[11px] text-slate-600">{captions[0].convertTip}</p>
        </div>
        <div className="rounded-xl bg-white/90 border border-slate-200 p-4">
          <p className="text-xs font-bold text-red-900 uppercase tracking-wide">口播节奏</p>
          <p className="mt-2 text-sm text-slate-700">
            {Array.from(new Set(scriptBeats.map((s) => s.beat)))
              .slice(0, 6)
              .join(" → ")}
            …
          </p>
        </div>
      </div>
    </section>
  );
}
