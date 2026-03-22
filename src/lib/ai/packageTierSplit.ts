/**
 * V96: Split full packages into free-visible (truncated / no strategy) vs Pro-only preview slots.
 */

import type { CreatorPostPackage } from "@/lib/ai/postPackage";

export type LockedPackagePreview = {
  hookTeaser: string;
  /** V104.2 — truncated from real generation (value preview, not lorem) */
  scriptTeaser?: string;
  structureHint?: string;
};

const CAP_SCRIPT = 320;
const CAP_CAPTION = 520;
/** V102.2 — China free tier: shorter bodies = stronger Pro gap */
const CAP_SCRIPT_CN = 200;
const CAP_CAPTION_CN = 340;
const CAP_HOOK_CN = 150;
/** V104.2 — Douyin tools: strongest free vs Pro gap */
const CAP_HOOK_DOUYIN = 95;
const CAP_SCRIPT_DOUYIN = 115;
const CAP_CAPTION_DOUYIN = 185;

function trunc(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return t.slice(0, n).trimEnd() + "…";
}

export type FreeTierSplitOptions = {
  /** V100.1 — core supporters see one extra visible package on free tier */
  extraVisibleSlots?: number;
  /** V102.2 — stricter CN free tier: fewer visible slots + tighter truncation */
  cnHardPaywall?: boolean;
  /** V104.2 — Douyin stack only: 1 visible package + tightest truncation + rich locked teasers */
  douyinHardPaywall?: boolean;
};

/** Free: first N packages (or more with perks), shorter body, strategy fields removed (Pro-only per V96). */
export function toFreeVisiblePackages(
  packages: CreatorPostPackage[],
  options?: FreeTierSplitOptions
): CreatorPostPackage[] {
  const douyin = options?.douyinHardPaywall === true;
  const baseVisible = douyin ? 1 : options?.cnHardPaywall ? 2 : 3;
  const visible = Math.min(5, baseVisible + (options?.extraVisibleSlots ?? 0));
  const capScript = douyin ? CAP_SCRIPT_DOUYIN : options?.cnHardPaywall ? CAP_SCRIPT_CN : CAP_SCRIPT;
  const capCaption = douyin ? CAP_CAPTION_DOUYIN : options?.cnHardPaywall ? CAP_CAPTION_CN : CAP_CAPTION;
  const capHook = douyin ? CAP_HOOK_DOUYIN : options?.cnHardPaywall ? CAP_HOOK_CN : Infinity;
  const cn = options?.cnHardPaywall === true || douyin;
  return packages.slice(0, visible).map((p) => ({
    ...p,
    topic: cn ? trunc(p.topic ?? "", douyin ? 40 : 56) : p.topic,
    hook: Number.isFinite(capHook) ? trunc(p.hook, capHook as number) : p.hook,
    script_talking_points: trunc(p.script_talking_points, capScript),
    caption: trunc(p.caption, capCaption),
    cta_line: cn ? trunc(p.cta_line, douyin ? 72 : 90) : p.cta_line,
    hashtags: cn ? trunc(p.hashtags, douyin ? 64 : 80) : p.hashtags,
    why_it_works: "",
    posting_tips: "",
    best_for: "",
    /** V106 — strategy + comparison Pro-only on free tier (keep pack label + hook strength as hooks) */
    why_opening_grabs: "",
    why_structure_completion: "",
    why_copy_growth: "",
    context_account: "",
    context_scenario: "",
    context_audience: "",
    publish_rhythm: "",
    version_optimized: "",
    version_plain: cn ? trunc(p.version_plain ?? "", douyin ? 100 : 140) : p.version_plain
  }));
}

/** V103.1 — Lock all packages beyond freeVisibleCount (Pro may have 10+) */
export function buildLockedPreviews(
  packages: CreatorPostPackage[],
  freeVisibleCount = 3,
  opts?: { douyinRichTeasers?: boolean }
): LockedPackagePreview[] {
  return packages.slice(freeVisibleCount).map((p) => {
    const hookTeaser = trunc(p.hook, 100) || "Pro 变体 · 解锁完整钩子与文案包…";
    if (!opts?.douyinRichTeasers) {
      return { hookTeaser };
    }
    return {
      hookTeaser,
      scriptTeaser: trunc(p.script_talking_points, 130) || undefined,
      structureHint: p.why_opening_grabs?.trim()
        ? `Pro 完整解读：${trunc(p.why_opening_grabs, 96)}`
        : p.why_it_works?.trim()
          ? `Pro 完整解读：${trunc(p.why_it_works, 96)}`
          : "Pro：更强钩子 + 完整五段口播 +「为什么能爆」与转化拆解"
    };
  });
}

export function ensureMinPackages(
  packages: CreatorPostPackage[],
  min: number,
  factory: (i: number) => CreatorPostPackage
): CreatorPostPackage[] {
  const out = [...packages];
  let i = 0;
  while (out.length < min) {
    out.push(factory(i++));
  }
  return out.slice(0, min);
}
