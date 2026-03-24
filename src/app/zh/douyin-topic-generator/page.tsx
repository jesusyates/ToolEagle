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

const LABELS_ZH = {
  hook: "选题摘要",
  script_talking_points: "选题列表（多条）",
  caption: "赛道 / 分类",
  cta_line: "互动 / 转化提示",
  hashtags: "话题标签",
  why_it_works: "为什么能跑",
  posting_tips: "延伸与节奏",
  best_for: "适合账号类型"
} as const;

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-topic-generator",
  title: zhSeoTitle("抖音选题生成器 — 选题 · 分类 · 爆款理由"),
  description:
    "按你的赛道与人群批量产出可拍选题：每条含分类与「为什么能跑」；免费档部分结果，Pro 解锁完整策略与更多变体。"
});

export default async function ZhDouyinTopicGeneratorPage() {
  const keywords = await getLatestKeywordPagesCnSidebarCached(6, "/zh/douyin-topic-generator");
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <ZhDouyinToolIntro slug="douyin-topic-generator" />
      <div className="flex-1">
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <ZhDeferredPostPackageToolClient
            siteMode="china"
            toolSlug="douyin-topic-generator"
            toolKind="douyin_topic"
            packageLabelsZh={LABELS_ZH}
            relatedAside={
              <ZhDouyinToolRelatedAside currentSlug="douyin-topic-generator" variant="topic" />
            }
            eyebrow="抖音专栏 · 选题"
              title="批量产出「能拍、能进池」的抖音选题，并写清分类与理由"
              description="输入你的账号方向或一句话痛点，输出多条选题想法；每条配套赛道/分类与为什么适合抖音完播与评论。免费档为截断预览；Pro 解锁完整解读、延伸节奏与全部变体。"
              tryExample="同城美甲：想吸引周边 3 公里到店咨询，但不想只发优惠券"
              inputLabel="你的账号方向 / 想测的人群或场景"
              placeholder="例如：实体店老板做抖音，同城咨询少、只会发促销"
              generateButtonLabel="生成抖音选题包"
              resultTitle="你的抖音选题包（含分类与理由）"
              emptyMessage="写清账号类型、城市/赛道或想解决的用户问题，我们按抖音语境给可拍选题与分类标签。"
              howItWorksSteps={[
                { step: 1, text: "一句话说清：你是谁、服务谁、想带动什么结果（到店/私信/成交）。" },
                { step: 2, text: "生成多组选题——每条尽量 15–45 秒内能拍完，避免空泛口号。" },
                { step: 3, text: "对照「为什么能跑」筛 2–3 条先拍；其余留作下周选题池。" }
              ]}
              proTips={[
                "同城类优先「可验证结果」选题：前后对比、到店流程、客户原话。",
                "同一选题多生成几次，专门挑「身份锚定」不同的版本测池子。",
                "分类标签用来对齐抖音推荐，不要堆超过两个主赛道。"
              ]}
              examplesCategory="tiktok_caption"
              valueProofVariant="caption"
              ctaLinks={ctaLinks.length > 0 ? ctaLinks : undefined}
            />
        </Suspense>
      </div>
      <ZhDouyinToolSsrFooter slug="douyin-topic-generator" />
    </main>
  );
}
