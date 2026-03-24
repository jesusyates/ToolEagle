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
  hook: "开头钩子",
  script_talking_points: "内容流 / 中段结构",
  caption: "节奏与信息点",
  cta_line: "结尾 CTA",
  hashtags: "话题标签",
  why_it_works: "结构为什么有效",
  posting_tips: "拍摄提示",
  best_for: "适合场景"
} as const;

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-structure-generator",
  title: zhSeoTitle("抖音内容结构生成器 — 钩子 · 内容流 · 结尾 CTA"),
  description:
    "一条视频拆成「开头钩子—中段内容流—结尾 CTA」，对齐抖音完播；免费档部分结果，Pro 解锁完整拆解与更多变体。"
});

export default async function ZhDouyinStructureGeneratorPage() {
  const keywords = await getLatestKeywordPagesCnSidebarCached(6, "/zh/douyin-structure-generator");
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <ZhDouyinToolIntro slug="douyin-structure-generator" />
      <div className="flex-1">
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <ZhDeferredPostPackageToolClient
            siteMode="china"
            toolSlug="douyin-structure-generator"
            toolKind="douyin_structure"
            packageLabelsZh={LABELS_ZH}
            relatedAside={
              <ZhDouyinToolRelatedAside currentSlug="douyin-structure-generator" variant="structure" />
            }
              eyebrow="抖音专栏 · 结构"
              title="用「钩子—内容流—结尾 CTA」把一条抖音拆成可拍骨架"
              description="适合口播与轻剧情：中段按气口或分镜写清信息流，结尾给可执行互动。免费档为截断预览；Pro 解锁完整策略、拍摄提示与全部变体。"
              tryExample="带货：30 秒内讲清一个卖点并引导评论城市"
              inputLabel="你的选题 / 这条视频要讲清的一件事"
              placeholder="例如：实体店老板口播，用一条视频说明「为什么我家复购高」"
              generateButtonLabel="生成内容结构包"
              resultTitle="你的抖音结构包（钩子 · 流 · 收口）"
              emptyMessage="写清一条视频的核心承诺与受众，我们按抖音节奏拆成中段信息流与结尾 CTA。"
              howItWorksSteps={[
                { step: 1, text: "先定一个主观点：全片只推进一件事，避免中段信息堆叠。" },
                { step: 2, text: "中段按气口写：放大痛点 → 少步骤 → 上证据，对齐完播。" },
                { step: 3, text: "结尾 CTA 与描述区/首评对齐，方便评论与私信转化。" }
              ]}
              proTips={[
                "前 3 秒要完成「身份 + 结果承诺」，中段只做证明与递进。",
                "同一条结构多生成几次，专测「钩子第一句」差异。",
                "结尾 CTA 尽量是可执行指令（评城市 / 选 A 或 B），比泛泛关注更有效。"
              ]}
              examplesCategory="tiktok_caption"
              valueProofVariant="ai_caption"
              ctaLinks={ctaLinks.length > 0 ? ctaLinks : undefined}
            />
        </Suspense>
      </div>
      <ZhDouyinToolSsrFooter slug="douyin-structure-generator" />
    </main>
  );
}
