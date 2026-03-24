"use client";

import Image from "next/image";

const WECHAT = process.env.NEXT_PUBLIC_DONATE_WECHAT_QR?.trim();
const ALIPAY = process.env.NEXT_PUBLIC_DONATE_ALIPAY_QR?.trim();

type DonationBoxProps = {
  /** V96: tighter layout for tool results */
  compact?: boolean;
  /** V97: zh-facing copy */
  variant?: "en" | "zh";
  /** V97.1 — stronger visual emphasis on China-local surfaces */
  prominent?: boolean;
  /** V101.1 — static QR is fallback only; not recorded in-app */
  fallbackUnrecorded?: boolean;
};

/**
 * V94: QR display only (V100.2 — use SupportModal / /zh/support for registration flow).
 * When no QR env is set, renders nothing (no placeholder strings on public pages).
 */
export function DonationBox({ compact, variant = "en", prominent = false, fallbackUnrecorded = false }: DonationBoxProps) {
  if (!WECHAT && !ALIPAY) return null;

  const zh = variant === "zh";
  const title =
    zh && fallbackUnrecorded
      ? "备用支持方式（不记录在系统中）"
      : zh
        ? "微信 / 支付宝 · 支持作者"
        : "Support ToolEagle";
  const sub =
    zh && fallbackUnrecorded
      ? "若无法使用上方订单支付，可扫个人收款码自愿支持；本站无法自动识别到账，权益与记录以订单支付为准。"
      : zh
        ? "国内用户可直接扫码打赏，帮助我们覆盖服务器与模型成本。"
        : "Keep this tool free for creators worldwide.";

  return (
    <div
      className={
        compact
          ? prominent
            ? "rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50/90 to-amber-50/50 p-3 w-full shadow-sm"
            : "rounded-xl border border-slate-200 bg-slate-50 p-3 w-full"
          : prominent
            ? "rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50/90 to-amber-50/50 p-5 max-w-md shadow-sm"
            : "rounded-2xl border border-slate-200 bg-slate-50 p-5 max-w-md"
      }
    >
      <p className={`font-bold text-slate-900 ${compact ? "text-xs" : "text-sm"}`}>{title}</p>
      <p className={`mt-0.5 text-slate-600 ${compact ? "text-[10px]" : "text-xs"}`}>{sub}</p>
      <div className={`flex flex-wrap ${compact ? "gap-3 mt-2 justify-start" : "gap-6 mt-4"}`}>
        {WECHAT ? (
          <div className="text-center">
            <p className={`font-medium text-slate-700 mb-1 ${compact ? "text-[10px]" : "text-xs mb-2"}`}>
              WeChat 微信
            </p>
            <Image
              src={WECHAT}
              alt="WeChat donation QR"
              width={compact ? 72 : 120}
              height={compact ? 72 : 120}
              className="rounded-lg border border-slate-200 bg-white mx-auto"
              unoptimized={WECHAT.startsWith("http")}
            />
          </div>
        ) : null}
        {ALIPAY ? (
          <div className="text-center">
            <p className={`font-medium text-slate-700 mb-1 ${compact ? "text-[10px]" : "text-xs mb-2"}`}>
              Alipay 支付宝
            </p>
            <Image
              src={ALIPAY}
              alt="Alipay donation QR"
              width={compact ? 72 : 120}
              height={compact ? 72 : 120}
              className="rounded-lg border border-slate-200 bg-white mx-auto"
              unoptimized={ALIPAY.startsWith("http")}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
