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
  hook: "置顶互动句",
  script_talking_points: "评论话术 / 接龙模板",
  caption: "适用场景",
  cta_line: "促评引导",
  hashtags: "可选标签",
  why_it_works: "为何能拉互动",
  posting_tips: "避坑与节奏",
  best_for: "适合内容类型"
} as const;

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-comment-cta-generator",
  title: zhSeoTitle("抖音评论引导生成器 — 互动话术 · 评论触发"),
  description:
    "生成置顶评论、接龙话术与选择题式互动，拉高评论率与复播；免费档部分结果，Pro 解锁完整包与更多变体。"
});

export default async function ZhDouyinCommentCtaGeneratorPage() {
  const keywords = await getLatestKeywordPagesCnSidebarCached(6, "/zh/douyin-comment-cta-generator");
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <ZhDouyinToolIntro slug="douyin-comment-cta-generator" />
      <div className="flex-1">
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <ZhDeferredPostPackageToolClient
            siteMode="china"
            toolSlug="douyin-comment-cta-generator"
            toolKind="douyin_comment_cta"
            packageLabelsZh={LABELS_ZH}
            relatedAside={
              <ZhDouyinToolRelatedAside currentSlug="douyin-comment-cta-generator" variant="comment_cta" />
            }
            eyebrow="抖音专栏 · 评论引导"
              title="把「评论区」变成第二条增长曲线：话术、接龙与触发器"
              description="针对抖音：输出可复制的互动句、评论接龙与促评引导，并说明适用场景与为什么能拉互动。免费档为截断预览；Pro 解锁完整策略与全部变体。"
              tryExample="知识口播：想让大家在评论区交作业而不是只点赞"
              inputLabel="你的视频类型 / 想拉什么互动（评论、私信、领资料）"
              placeholder="例如：带货短视频，想引导评论城市或预算区间方便跟进"
              generateButtonLabel="生成评论引导包"
              resultTitle="你的评论互动包（话术 + 触发器）"
              emptyMessage="说明视频主题、人群与你想收集的评论类型（城市、选项、打卡等），我们按合规可执行的抖音语境来写。"
              howItWorksSteps={[
                { step: 1, text: "确定目标互动：评论填空、二选一、接龙、打卡——只选一个主目标。" },
                { step: 2, text: "生成多组话术：置顶句 + 接龙模板 + 促评收尾，避免空喊「评论区见」。" },
                { step: 3, text: "把最佳句放进首评或口播结尾；对照数据迭代。" }
              ]}
              proTips={[
                "选择题式评论往往比开放提问更容易起量（给选项降低思考成本）。",
                "首评与口播最后一句要同向，避免用户听完却不知道评什么。",
                "涉及领资料或私信时，话术需真实可兑现，避免违规承诺。"
              ]}
              examplesCategory="hook"
              valueProofVariant="hook"
              ctaLinks={ctaLinks.length > 0 ? ctaLinks : undefined}
            />
        </Suspense>
      </div>
      <ZhDouyinToolSsrFooter slug="douyin-comment-cta-generator" />
    </main>
  );
}
