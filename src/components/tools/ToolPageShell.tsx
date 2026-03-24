import { ReactNode } from "react";
import { CommunityProofBadge } from "./CommunityProofBadge";
import { UpgradeToolMidCta } from "@/components/monetization/UpgradeToolMidCta";
import { ZhUpgradeStrip } from "@/components/monetization/ZhUpgradeStrip";
import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";

type ToolPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  /** V109.5 — First-screen clarity (global EN): what problem + who it’s for */
  introProblem?: string;
  introAudience?: string;
  input: ReactNode;
  result: ReactNode;
  howItWorks?: ReactNode;
  proTips?: ReactNode;
  aside?: ReactNode;
  toolSlug?: string;
  toolName?: string;
  /** V97.1 — China-local mid CTA → /zh/pricing */
  siteMode?: "global" | "china";
};

export function ToolPageShell({
  eyebrow,
  title,
  description,
  introProblem,
  introAudience,
  input,
  result,
  howItWorks,
  proTips,
  aside,
  toolSlug,
  toolName,
  siteMode = "global"
}: ToolPageShellProps) {
  /** 抖音专属工具页外层为 `bg-slate-950`，需浅色字才可读 */
  const headerOnDark =
    siteMode === "china" && typeof toolSlug === "string" && toolSlug.startsWith("douyin-");

  return (
    <section className="container pt-10 pb-16">
      {siteMode === "china" ? (
        <div className="max-w-2xl mb-6">
          <ZhDouyinTrafficInjectionBanner compact />
        </div>
      ) : null}
      <div className="space-y-2 max-w-2xl">
        {eyebrow && (
          <p
            className={
              headerOnDark
                ? "text-xs font-semibold tracking-wide text-red-300/95"
                : "text-xs font-semibold uppercase tracking-[0.2em] text-sky-700"
            }
          >
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          <span
            className={
              headerOnDark
                ? "inline-block rounded-xl bg-slate-900/70 px-2.5 py-1 text-white shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                : "inline-block rounded-xl bg-sky-100 px-2.5 py-1 text-sky-950 shadow-[0_2px_8px_rgba(2,132,199,0.18)]"
            }
          >
            {title}
          </span>
        </h1>
        <p
          className={
            headerOnDark
              ? "inline-block rounded-xl bg-slate-900/65 px-3 py-2 text-sm sm:text-base text-slate-100 leading-relaxed shadow-[0_6px_16px_rgba(0,0,0,0.32)]"
              : "inline-block rounded-xl bg-sky-50 px-3 py-2 text-sm sm:text-base text-slate-800 leading-relaxed shadow-[0_2px_8px_rgba(2,132,199,0.12)]"
          }
        >
          {description}
        </p>
        {!headerOnDark && (introProblem || introAudience) ? (
          <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-800">
            {introProblem ? (
              <p>
                <span className="font-semibold text-slate-900">What it solves: </span>
                {introProblem}
              </p>
            ) : null}
            {introAudience ? (
              <p>
                <span className="font-semibold text-slate-900">Best for: </span>
                {introAudience}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="pt-2">
          <CommunityProofBadge />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
        <div className="space-y-4">
          {input}
          {siteMode === "china" ? <ZhUpgradeStrip /> : <UpgradeToolMidCta />}
          {result}
          {howItWorks}
          {proTips}
        </div>
        {aside && <aside className="space-y-4">{aside}</aside>}
      </div>
    </section>
  );
}

