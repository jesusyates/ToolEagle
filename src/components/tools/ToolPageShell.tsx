import { ReactNode } from "react";
import { CommunityProofBadge } from "./CommunityProofBadge";
import { UpgradeToolMidCta } from "@/components/monetization/UpgradeToolMidCta";
import { ZhUpgradeStrip } from "@/components/monetization/ZhUpgradeStrip";
import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";

type ToolPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
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
        <h1
          className={
            headerOnDark
              ? "text-3xl sm:text-4xl font-semibold tracking-tight text-white drop-shadow-sm"
              : "text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900"
          }
        >
          {title}
        </h1>
        <p
          className={
            headerOnDark
              ? "text-sm sm:text-base text-slate-300 leading-relaxed"
              : "text-sm sm:text-base text-slate-600 leading-relaxed"
          }
        >
          {description}
        </p>
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

