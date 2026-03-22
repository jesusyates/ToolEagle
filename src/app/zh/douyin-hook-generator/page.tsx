import { Suspense } from "react";
import { ZhDeferredPostPackageToolClient } from "@/components/zh/ZhDeferredPostPackageToolClient";
import { getLatestKeywordPagesCnSidebarCached } from "@/lib/zh/cn-keyword-sidebar-cache";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { ZhDouyinToolRelatedAside } from "@/components/zh/cn-platforms/ZhDouyinToolRelatedAside";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-hook-generator",
  title: zhSeoTitle("抖音钩子生成器 — 爆款开头 · 停滑前两秒 · 涨粉转化"),
  description:
    "抖音爆款先看开头：身份锚定、结果前置、同城/带货可用的停滑句式；配套口播与文案块。免费档展示部分片段与少量变体，Pro 解锁全部内容与策略拆解。"
});

export default async function ZhDouyinHookGeneratorPage() {
  const keywords = await getLatestKeywordPagesCnSidebarCached(6, "/zh/douyin-hook-generator");
  const ctaLinks = keywords.map((k) => ({ href: `/zh/search/${k.slug}`, label: k.keyword }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <div className="flex-1">
        <Suspense fallback={<div className="container pt-10 pb-16 min-h-[400px]" />}>
          <ZhDeferredPostPackageToolClient
            siteMode="china"
            toolSlug="douyin-hook-generator"
            toolKind="hook_focus"
            relatedAside={
              <ZhDouyinToolRelatedAside currentSlug="douyin-hook-generator" variant="hook" />
            }
              eyebrow="抖音专栏 · 黄金开头"
              title="先把抖音「前两秒」说对，再写整条视频"
              description="开头决定涨粉与完播：输入选题，一次拿多版停滑开场 + 口播要点 + 正文块，偏同城、带货、知识语境。免费档为截断预览；Pro 解锁「为什么能爆」、转化建议与全部变体。"
              tryExample="知识博主：为什么你讲干货却没完播——我用一个开头改掉了"
              inputLabel="选题 / 想传递的核心信息"
              placeholder="例如：同城餐饮老板做抖音，别只拍菜品，先拍「为什么你家排队」"
              generateButtonLabel="生成抖音钩子 + 文案块"
              resultTitle="钩子与配套文案"
              emptyMessage="先写一句你的抖音选题或观点，我们再拆成可拍的开场与结构。"
              howItWorksSteps={[
                { step: 1, text: "一句话说明：这条抖音要抢哪类人群的注意力。" },
                { step: 2, text: "生成多套钩子——优先试「身份 + 结果 + 悬念」组合。" },
                { step: 3, text: "选定开场后开拍；其余变体存作下一条测试。" }
              ]}
              proTips={[
                "抖音钩子尽量口语化，能直接念出来；书面语容易像广告。",
                "同城类账号开头点名城市/片区，常比泛泛的「大家好」更有效。",
                "同选题试反差、数字、POV 三种开头，看哪类在你账号上更稳。"
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
