"use client";

import Link from "next/link";
import { UpgradeLink } from "@/components/monetization/UpgradeLink";
import { ZhPricingLink } from "@/components/monetization/ZhPricingLink";
import { trackConversion } from "@/lib/analytics/conversionClient";
import { Check } from "lucide-react";

const MESSAGE_DEFAULT =
  "You've reached today's free limit. Get results faster — upgrade to Pro for unlimited AI and save hours every week.";

const MESSAGE_QUALITY =
  "You've hit today's free limit. Pro unlocks unlimited runs plus full post packages: more variants, deeper “why it works” and posting strategy — not just more lines of text.";

const MESSAGE_QUALITY_ZH =
  "今天的免费次数已用完。充值算力包后，在有效期内按剩余次数生成完整爆款文案包：涨粉更快、提高完播率、直接可用文案、爆款结构——不只是多几行字。";

type LimitReachedModalProps = {
  open: boolean;
  onClose: () => void;
  variant?: "default" | "quality";
  /** V97.1 — China-local modal copy + /zh/pricing secondary CTA */
  locale?: "en" | "zh_cn";
};

/** V96: Mini sales page — outcome bullets + dual CTAs */
export function LimitReachedModal({ open, onClose, variant = "default", locale = "en" }: LimitReachedModalProps) {
  if (!open) return null;

  const zh = locale === "zh_cn";
  const message = zh
    ? MESSAGE_QUALITY_ZH
    : variant === "quality"
      ? MESSAGE_QUALITY
      : MESSAGE_DEFAULT;

  const bullets = zh
    ? [
        "算力包在有效期内按次使用——涨粉更快，不再被每日免费额度卡住",
        "每次最多 10 套完整文案包（带货/情绪/干货/娱乐多风格 + 直接可用文案）",
        "提高完播率：爆款结构、强互动、转化型开头一包搞定"
      ]
    : [
        "Unlimited generations — no daily cap",
        "5 full post packages per run (hook → script → caption → CTA → tags + strategy)",
        "Unlock blurred Pro-only variants you already saw in results"
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
          {zh ? "ToolEagle 算力包" : "ToolEagle Pro"}
        </p>
        <h2 id="limit-modal-title" className="text-xl font-bold text-slate-900 mt-1">
          {zh ? "今日免费次数已用完 — 解锁更多爆款文案" : "You’re out of free AI runs today"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        <ul className="mt-5 space-y-2">
          {bullets.map((t) => (
            <li key={t} className="flex gap-2 text-sm text-slate-800">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{t}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-700">{zh ? "适合谁" : "Typical wins"}</p>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            {zh
              ? "日更账号用算力包批量出爆款结构、直接可用文案，提高完播率、涨粉更快——少在同样结构上反复改稿。"
              : "Creators who post daily use Pro to batch hooks + captions, keep “why it works” notes for every variant, and stop burning time rewriting the same structure."}
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {zh ? (
            <Link
              href="/zh/pricing#cn-pro-checkout"
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white hover:bg-slate-800"
              onClick={() => trackConversion("pricing_open", { source: "limit_modal_cn_pro" })}
            >
              解锁全部爆款文案 — 去充值算力 →
            </Link>
          ) : (
            <UpgradeLink
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white hover:bg-slate-800"
              conversionSource="limit_modal_primary"
            >
              Upgrade — continue creating →
            </UpgradeLink>
          )}
          {zh ? (
            <ZhPricingLink
              href="/zh/pricing"
              className="flex-1 rounded-xl border-2 border-sky-400 bg-sky-50 px-4 py-3 text-center text-sm font-bold text-sky-900 hover:bg-sky-100"
              conversionSource="limit_modal_zh_pricing"
            >
              定价说明
            </ZhPricingLink>
          ) : (
            <Link
              href="/pricing"
              className="flex-1 rounded-xl border-2 border-sky-400 bg-sky-50 px-4 py-3 text-center text-sm font-bold text-sky-900 hover:bg-sky-100"
              onClick={() => trackConversion("pricing_open", { source: "limit_modal" })}
            >
              Compare plans
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {zh ? "我先等等 — 关闭" : "I’ll wait — close"}
        </button>
      </div>
    </div>
  );
}
