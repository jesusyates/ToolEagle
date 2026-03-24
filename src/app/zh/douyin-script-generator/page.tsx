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
  zhPath: "/zh/douyin-script-generator",
  title: zhSeoTitle("抖音口播脚本生成器 — 爆款五段气口 · 完播与转化"),
  description:
    "按抖音结构拆口播：钩子—放大—步骤—证据—互动；可粘提词器直录。免费档部分片段；Pro 解锁完整脚本包、发布与转化建议及全部变体。"
});

export default async function ZhDouyinScriptGeneratorPage() {
  const keywords = await getLatestKeywordPagesCnSidebarCached(6, "/zh/douyin-script-generator");
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <ZhDouyinToolIntro slug="douyin-script-generator" />
      <div className="flex-1">
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <ZhDeferredPostPackageToolClient
            siteMode="china"
            toolSlug="douyin-script-generator"
            toolKind="tiktok_caption"
            relatedAside={
              <ZhDouyinToolRelatedAside currentSlug="douyin-script-generator" variant="script" />
            }
            eyebrow="抖音专栏 · 口播脚本"
            title="把抖音口播拆成「五段气口」，提词器里直接念"
            description="竖屏口播一次生成五段气口 + 话题；适合日更、带货、知识口播。按抖音节奏压缩信息，不是长台本。免费档为截断预览；Pro 解锁完整包、转化/涨粉拆解与全部变体。"
            tryExample="带货口播：同一款洁面，为什么我说「只讲成分没转化」"
            inputLabel="这条口播要讲清的主题 / 产品或观点"
            placeholder="例如：用 30 秒讲清「小店主做抖音别先买设备」"
            generateButtonLabel="生成口播脚本包"
            resultTitle="口播脚本与文案包"
            emptyMessage="写清：你是谁、讲给谁、想带动什么互动。我们按抖音常见五段结构生成可拍稿。"
            howItWorksSteps={[
              { step: 1, text: "确定一条主线：只推进一个结论，别在同一条里塞三个主题。" },
              { step: 2, text: "生成后先看「口播要点」气口是否顺；再对齐正文与引导。" },
              { step: 3, text: "把要点粘进提词器先录一版，再回来微调语气。" }
            ]}
            proTips={[
              "中段每 5–8 秒要有一个信息增量，否则抖音完播容易掉。",
              "证据用数字、对比、用户原话截一句，比形容词更有信任。",
              "结尾互动要可执行：评论关键词、二选一、或私信触发话术。"
            ]}
            examplesCategory="tiktok_caption"
            valueProofVariant="caption"
            ctaLinks={ctaLinks.length > 0 ? ctaLinks : undefined}
          />
        </Suspense>
      </div>
      <ZhDouyinToolSsrFooter slug="douyin-script-generator" />
    </main>
  );
}
