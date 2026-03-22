import { Suspense } from "react";
import Link from "next/link";
import { ZhDeferredPostPackageToolClient } from "@/components/zh/ZhDeferredPostPackageToolClient";
import { getLatestKeywordPagesCnSidebarCached } from "@/lib/zh/cn-keyword-sidebar-cache";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { ZH } from "@/lib/zh-site/paths";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/hook-generator",
  title: zhSeoTitle("短视频钩子生成器 — 黄金开头"),
  description: "把选题压成前几秒能停滑的钩子，并配套口播要点与文案块。面向涨粉与完播，中文创作者向表达。"
});

export default async function ZhHookGeneratorPage() {
  const keywords = await getLatestKeywordPagesCnSidebarCached(6, "/zh/hook-generator");
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1">
        <p className="container pt-4 text-xs text-slate-600">
          主攻抖音？用{" "}
          <Link href={ZH.douyinHook} className="text-red-800 font-semibold hover:underline">
            抖音钩子生成器
          </Link>{" "}
          或{" "}
          <Link href={ZH.douyinHub} className="text-red-800 font-semibold hover:underline">
            抖音专栏首页
          </Link>
          。
        </p>
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <ZhDeferredPostPackageToolClient
            siteMode="china"
            toolSlug="hook-generator"
            toolKind="hook_focus"
            eyebrow="中文站 · 黄金开头"
            title="先把「前 1 秒」说清楚，再写整条视频"
            description="信息流里，开头就是封面。输入你的选题，生成多种钩子开场，并附带口播要点、正文与引导——方便你直接开拍或交给团队执行。"
            tryExample="给实体店老板看的抖音：为什么只发优惠没流量"
            inputLabel="选题 / 想传递的核心信息"
            placeholder="例如：揭秘我如何把口播时长压到 25 秒但不失信息密度"
            generateButtonLabel="生成钩子 + 文案包"
            resultTitle="钩子与完整文案包"
            emptyMessage="先写一句你想讲的话题或观点，我们再帮你拆成可拍的开场与结构。"
            howItWorksSteps={[
              { step: 1, text: "用一句话说明：这条视频的核心信息或争议点是什么。" },
              { step: 2, text: "生成多套开头钩子，并自动带上口播与正文块。" },
              { step: 3, text: "选定一条钩子后开拍；其余变体留作下一条备用。" }
            ]}
            proTips={[
              "同一选题试「反差」「数字」「POV」三种开头，看哪类在你账号上更稳。",
              "钩子越具体，越容易在评论区引发站队讨论。",
              "Pro 给你更多变体与更完整的策略拆解。"
            ]}
            examplesCategory="hook"
            valueProofVariant="hook"
            ctaLinks={ctaLinks}
          />
        </Suspense>
      </div>
    </main>
  );
}
