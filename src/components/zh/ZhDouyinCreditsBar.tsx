"use client";

import Link from "next/link";
import { ZH } from "@/lib/zh-site/paths";

type Billing = "free" | "credits" | "legacy_pro" | null;

type Props = {
  authenticated: boolean;
  billing: Billing;
  usageRemaining: number | null;
  creditsRemaining: number | null;
  creditsDaysLeft: number | null;
  publishFullPack: boolean;
  loginNextPath?: string;
};

/**
 * V109.2 — 抖音工具顶栏：剩余额度 + 本次预估消耗 + 充值入口（轻量、不恐慌式转化）
 */
export function ZhDouyinCreditsBar({
  authenticated,
  billing,
  usageRemaining,
  creditsRemaining,
  creditsDaysLeft,
  publishFullPack,
  loginNextPath = "/zh"
}: Props) {
  const pricingHref = `${ZH.pricing}#cn-credits-checkout`;
  const loginHref = `/zh/login?next=${encodeURIComponent(loginNextPath)}`;

  const usingCredits = billing === "credits" && (creditsRemaining ?? 0) > 0;
  const costHint = publishFullPack
    ? "本次若走「完整内容包」，通常会消耗更多次数（以实际结算为准）。"
    : "本次一般按约 1 次计（以实际结算为准）。";

  return (
    <div className="sticky top-[3.25rem] z-30 border-b border-red-900/30 bg-slate-900/95 backdrop-blur-md shadow-sm shadow-black/20">
      <div className="container max-w-3xl py-2.5 px-3 text-xs leading-snug text-slate-200 md:text-[13px]">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <div className="min-w-0 flex-1 space-y-0.5">
            {!authenticated ? (
              <p>
                <span className="text-slate-400">未登录：</span>
                可先试用免费次数。
                <Link href={loginHref} className="ml-1 font-semibold text-amber-200 underline-offset-2 hover:underline">
                  登录
                </Link>
                后可同步算力与订单记录。
              </p>
            ) : usingCredits ? (
              <p>
                <span className="font-semibold text-amber-100">算力剩余 {creditsRemaining} 次</span>
                {creditsDaysLeft != null ? (
                  <span className="text-slate-400"> · 约 {creditsDaysLeft} 天有效</span>
                ) : null}
              </p>
            ) : billing === "legacy_pro" ? (
              <p className="text-slate-300">当前为 Pro / 迁移权益；生成仍按次数与结算规则执行。</p>
            ) : (
              <p>
                <span className="text-slate-400">今日免费剩余</span>{" "}
                <span className="font-semibold text-white">{usageRemaining ?? "—"}</span> 次
                {usageRemaining === 0 ? (
                  <span className="text-slate-400"> · 可充值算力继续生成</span>
                ) : null}
              </p>
            )}
            <p className="text-[11px] text-slate-500">{costHint}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={pricingHref}
              className="inline-flex min-h-[2.25rem] items-center rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-500 md:text-xs"
            >
              去充值
            </Link>
            <Link
              href="/zh/dashboard/billing"
              className="hidden text-[11px] text-slate-400 hover:text-white sm:inline"
            >
              明细
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
