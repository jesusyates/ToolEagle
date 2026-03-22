import { Suspense } from "react";
import Link from "next/link";
import { ZhDeferredPostPackageToolClient } from "@/components/zh/ZhDeferredPostPackageToolClient";
import { getLatestKeywordPagesCnSidebarCached } from "@/lib/zh/cn-keyword-sidebar-cache";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/tiktok-caption-generator",
  title: zhSeoTitle("抖音 / 短视频文案包生成器"),
  description:
    "输入一个视频主题，一次生成钩子、口播要点、正文、引导、话题标签与爆款逻辑——面向日更自媒体与带货短视频，可直接开拍。"
});

export default async function ZhTikTokCaptionShortPathPage() {
  const keywords = await getLatestKeywordPagesCnSidebarCached(6, "/zh/tiktok-caption-generator");
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1">
        <p className="container pt-4 text-xs text-slate-600">
          主攻抖音流量？使用{" "}
          <Link href={ZH.douyinCaption} className="text-red-800 font-semibold hover:underline">
            抖音专栏版文案包
          </Link>{" "}
          或进入{" "}
          <Link href={ZH.douyinHub} className="text-red-800 font-semibold hover:underline">
            抖音增长中心
          </Link>
          。
        </p>
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <ZhDeferredPostPackageToolClient
            siteMode="china"
            toolSlug="tiktok-caption-generator"
            toolKind="tiktok_caption"
            eyebrow="中文站 · 短视频文案包"
            title="把一条视频拆成「能拍、能发」的完整结构"
            description="不止一句话文案：一次拿到开头钩子、口播要点、正文、引导话术、话题标签，以及「为什么能爆」——适合抖音、视频号、Reels 同一套工作流。免费档先看结构，Pro 解锁更深策略与全部变体。"
            tryExample="一条关于「上班族 15 分钟备餐」的口播短视频"
            inputLabel="你的视频主题 / 想讲什么"
            placeholder="例如：用 20 秒讲清楚「我为什么不用碎片时间刷短视频」"
            generateButtonLabel="生成完整文案包"
            resultTitle="你的文案包（可直接复制）"
            emptyMessage="在上面用一句话描述你的选题或场景，我们会生成多套结构化文案，方便你挑选后开拍。"
            howItWorksSteps={[
              { step: 1, text: "用口语写清楚：这条视频要讲什么、给谁看、想达到什么互动。" },
              { step: 2, text: "点击生成——每套包含钩子、口播要点、正文、引导、标签与策略提示。" },
              { step: 3, text: "复制到提词器或草稿，按你的语气微调后直接拍摄发布。" }
            ]}
            proTips={[
              "同一主题多生成几次，专门挑「开头不一样」的版本做 A/B。",
              "先拍口播要点，再回头改正文，往往比从文案倒推镜头更快。",
              "Pro 每次可拿更多变体与更完整的「为什么能爆」说明。"
            ]}
            examplesCategory="tiktok_caption"
            valueProofVariant="caption"
            ctaLinks={ctaLinks.length > 0 ? ctaLinks : undefined}
          />
        </Suspense>
      </div>
    </main>
  );
}
