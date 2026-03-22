"use client";

import { STRUCTURED_EXAMPLES, CTA_PATTERNS, type ExampleCategory } from "@/data/core-structured-examples";
import { ZH_STRUCTURED_EXAMPLES, ZH_CTA_PATTERNS } from "@/data/zh-structured-examples";

type Props = {
  category: ExampleCategory;
  onPickExample: (text: string) => void;
  /** V97.1 — China-local pattern library copy + examples */
  locale?: "en" | "zh";
};

export function StructuredExamplesLibrary({ category, onPickExample, locale = "en" }: Props) {
  const rows = locale === "zh" ? ZH_STRUCTURED_EXAMPLES[category] : STRUCTURED_EXAMPLES[category];
  const zh = locale === "zh";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        {zh ? `爆款结构库（${rows.length} 条）` : `Pattern library (${rows.length} examples)`}
      </h2>
      <p className="text-xs text-slate-600 mt-1">
        {zh
          ? "生成前先翻翻：每一行都是「赛道 → 目标 → 结构 → 可直接改的句子」。点一下就能填进主题框。"
          : "Use these before you generate — each row is niche → goal → pattern → line you can steal."}
      </p>
      <ul className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {rows.map((row, i) => (
          <li key={i} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm">
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-500">
              <span className="font-semibold text-sky-800">{row.niche}</span>
              <span>·</span>
              <span>
                {zh ? "目标" : "Goal"}: {row.goal}
              </span>
              <span>·</span>
              <span className="text-slate-700">
                {zh ? "结构" : "Pattern"}: {row.pattern}
              </span>
            </div>
            <p className="mt-2 text-slate-900 font-medium leading-snug">{row.example}</p>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{row.why_it_works}</p>
            <button
              type="button"
              onClick={() => onPickExample(row.example)}
              className="mt-2 text-xs font-semibold text-sky-700 hover:underline"
            >
              {zh ? "填入主题框 →" : "Use as topic →"}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-800">{zh ? "引导话术模板" : "CTA patterns"}</p>
        <ul className="mt-2 space-y-2 text-xs text-slate-600">
          {(zh ? ZH_CTA_PATTERNS : CTA_PATTERNS.slice(0, 6)).map((c, j) => (
            <li key={j}>
              <span className="font-medium text-slate-800">{c.pattern}</span>
              <span className="text-slate-500"> — {c.use_when}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
