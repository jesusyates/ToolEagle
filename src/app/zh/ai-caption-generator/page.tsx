import { Suspense } from "react";
import Link from "next/link";
import { ZhDeferredPostPackageToolClient } from "@/components/zh/ZhDeferredPostPackageToolClient";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { ZH } from "@/lib/zh-site/paths";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/ai-caption-generator",
  title: zhSeoTitle("短视频文案包 — 涨粉结构 · 多平台一稿多用"),
  description:
    "一个选题拉满钩子、口播、正文、引导与话题；偏转化与爆款结构。主攻抖音请优先抖音专栏工具与模板库，涨粉/带货语境更准。"
});

export default function ZhAiCaptionGeneratorPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1">
        <div className="container max-w-3xl pt-8 text-sm text-slate-700">
          <p>
            主攻<strong>抖音涨粉/爆款/转化</strong>？优先{" "}
            <Link href={ZH.douyinHub} className="text-red-800 font-bold hover:underline">
              抖音增长中心
            </Link>{" "}
            与{" "}
            <Link href={ZH.douyinCaption} className="text-red-800 font-bold hover:underline">
              抖音文案包生成器
            </Link>
            （语境按国内短视频习惯，非直译）。
          </p>
        </div>
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <ZhDeferredPostPackageToolClient
            siteMode="china"
            toolSlug="ai-caption-generator"
            toolKind="ai_caption"
            eyebrow="中文站 · 多平台"
            title="一个选题，拉满「能发、能转化」的全套文案块"
            description="面向要带货、要私域、要日更的创作者：把产品、观点或故事讲清楚，一次生成钩子、口播要点、正文、引导与话题；更偏抖音语境请用抖音专栏工具。免费档为部分结果，Pro 解锁全部内容与策略字段。"
            tryExample="推广一款帮自媒体做选题表的 Notion 模板，面向周更博主"
            inputLabel="你要讲的产品 / 故事 / 知识点"
            placeholder="例如：这周想发一条「副业踩坑」复盘，目标引导私信领清单"
            generateButtonLabel="生成 AI 文案包"
            resultTitle="AI 生成的文案包"
            emptyMessage="用一两句话写清：你卖什么、讲什么、希望观众做完什么动作（关注 / 评论 / 私信）。"
            howItWorksSteps={[
              { step: 1, text: "用口语描述你的 offer 或观点，不必写得像广告词。" },
              { step: 2, text: "生成结构化文案包——含钩子、分镜式口播、正文与引导。" },
              { step: 3, text: "按平台微调语气后发布；同一主题可再生成做对比测试。" }
            ]}
            proTips={[
              "写清楚「给谁看」比堆砌卖点更重要，CTA 会明显更准。",
              "把「为什么能爆」复制到选题表，积累可复用的结构。",
              "Pro 每次更多变体，适合批量拍摄日。"
            ]}
            examplesCategory="ai_caption"
            valueProofVariant="ai_caption"
          />
        </Suspense>
      </div>
    </main>
  );
}
