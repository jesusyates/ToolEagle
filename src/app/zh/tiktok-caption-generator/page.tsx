import { Suspense } from "react";
import Link from "next/link";
import { ZhDeferredPostPackageToolClient } from "@/components/zh/ZhDeferredPostPackageToolClient";
import { getLatestKeywordPagesCnSidebarCached } from "@/lib/zh/cn-keyword-sidebar-cache";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/tiktok-caption-generator",
  title: zhSeoTitle("TikTok标题生成器"),
  description:
    "使用一个创意生成完整 TikTok 帖子：开场白、发言要点、标题文案、行动号召（CTA）与标签；在此生成后粘贴到「描述你的帖子」发布，并在个人资料中查看。"
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
            eyebrow="中文站 · TikTok"
            title="TikTok标题生成器"
            description="该工具的作用：使用一个创意生成完整的 TikTok 帖子，并为您提供开场白、发言要点、标题文本、行动号召（CTA）和可直接使用的标签。"
            introProblem="在此生成，粘贴到 TikTok「描述你的帖子」中发布，然后在个人资料中查看。"
            tryExample="一条关于「上班族 15 分钟备餐」的口播短视频"
            inputLabel="你的视频主题 / 想讲什么"
            placeholder="例如：用 20 秒讲清楚「我为什么不用碎片时间刷短视频」"
            generateButtonLabel="生成完整文案包"
            resultTitle="你的文案包（可直接复制）"
            emptyMessage="在上面写清选题，点击生成；复制结果后打开 TikTok 发布页，粘贴到「描述你的帖子」再发布。"
            howItWorksSteps={[
              { step: 1, text: "在本页输入你的视频创意（一句话也可以），点击生成。" },
              { step: 2, text: "在结果里复制你需要的内容（可整包复制，或只复制描述区要用的段落）。" },
              { step: 3, text: "打开 TikTok → 点底部「+」→ 选好要发的视频 → 进入发布页，把文案粘贴到「描述你的帖子」输入框。" },
              { step: 4, text: "点「发布」。发布后点右下角「我」进入个人主页，即可看到刚发的作品。" }
            ]}
            proTips={[
              "同一主题多生成几次，挑开头最抓人的那一版再拍。",
              "若视频里已有大字幕，描述区可只保留行动号召与话题标签。",
              "发布前快速通读一遍，把口吻改成你自己平时说话的方式。"
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
