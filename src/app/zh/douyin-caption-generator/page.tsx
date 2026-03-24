import { Suspense } from "react";
import { ZhDeferredPostPackageToolClient } from "@/components/zh/ZhDeferredPostPackageToolClient";
import { getLatestKeywordPagesCnSidebarCached } from "@/lib/zh/cn-keyword-sidebar-cache";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { ZhDouyinToolRelatedAside } from "@/components/zh/cn-platforms/ZhDouyinToolRelatedAside";
import {
  ZhDouyinToolIntro,
  ZhDouyinToolSsrFooter
} from "@/components/zh/cn-platforms/ZhDouyinToolSsrBody";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-caption-generator",
  title: zhSeoTitle("抖音文案包生成器 — 爆款结构 · 钩子口播描述区一体"),
  description:
    "一次生成钩子、口播、正文、引导与话题，偏涨粉与转化；示例按抖音完播与互动写。免费档部分结果；Pro 解锁全部文案包、策略字段与更多变体。"
});

export default async function ZhDouyinCaptionGeneratorPage() {
  const keywords = await getLatestKeywordPagesCnSidebarCached(6, "/zh/douyin-caption-generator");
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <ZhDouyinToolIntro slug="douyin-caption-generator" />
      <div className="flex-1">
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <ZhDeferredPostPackageToolClient
            siteMode="china"
            toolSlug="douyin-caption-generator"
            toolKind="tiktok_caption"
            relatedAside={
              <ZhDouyinToolRelatedAside currentSlug="douyin-caption-generator" variant="caption" />
            }
              eyebrow="抖音专栏 · 文案包"
              title="把一条抖音视频拆成「能拍、能发、能带互动」的完整结构"
              description="针对抖音信息流：一次拿齐钩子、口播、正文、引导与话题；适合同城、带货、知识口播。免费档为截断预览 + 少量变体；Pro 解锁完整包、为什么能爆、转化与涨粉向建议及全部变体。"
              tryExample="抖音同城美甲店：如何用 20 秒讲清「为什么我家复购高」"
              inputLabel="你的抖音选题 / 想讲清楚的一件事"
              placeholder="例如：实体店老板做抖音，为什么只发优惠没同城咨询"
              generateButtonLabel="生成抖音文案包"
              resultTitle="你的抖音文案包（可复制到提词器与描述区）"
              emptyMessage="用一句话写清：这条抖音讲给谁听、想带动什么互动（评论/私信/到店）。我们再按抖音语境拆成可拍结构。"
              howItWorksSteps={[
                { step: 1, text: "写清人群与场景：同城谁、带货什么、或知识类用户的具体痛点。" },
                { step: 2, text: "生成多套结构——钩子与口播对齐，描述区可直接配合评论区引导。" },
                { step: 3, text: "选定一条开拍；其余变体留作下一条或 A/B 开头。" }
              ]}
              proTips={[
                "抖音更适合「一句话承诺 + 15 秒内兑现第一步」，别堆三个观点在同一条。",
                "描述区加「选择题式」互动，往往比泛泛的「点赞支持」更有效。",
                "同一选题多生成几次，专门挑「开头身份锚定」不同的版本测池子。"
              ]}
              examplesCategory="tiktok_caption"
              valueProofVariant="caption"
              ctaLinks={ctaLinks.length > 0 ? ctaLinks : undefined}
            />
        </Suspense>
      </div>
      <ZhDouyinToolSsrFooter slug="douyin-caption-generator" />
    </main>
  );
}
