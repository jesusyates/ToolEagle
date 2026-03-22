import Link from "next/link";
import { DouyinSeoClusterNav } from "@/components/zh/cn-platforms/DouyinSeoClusterNav";
import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";
import { DOUYIN_TOPIC_IDEA_EXAMPLES } from "@/lib/zh-site/douyin-example-library";
import { DouyinSeoToolLinksStrip } from "@/components/zh/cn-platforms/DouyinSeoToolLinksStrip";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-topic-ideas",
  title: zhSeoTitle("抖音选题灵感 & 可拍方向 — 分类 · 爆款逻辑"),
  description:
    "抖音发什么选题容易进池？按赛道整理可拍选题、分类标签与「为什么能跑」；内链选题生成器、钩子与文案包，留在站内闭环。"
});

export default function ZhDouyinTopicIdeasSeoPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <article className="flex-1 container pt-10 pb-16 max-w-3xl">
        <div className="mb-6">
          <ZhDouyinTrafficInjectionBanner />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-800">抖音 SEO · 选题</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
          抖音选题灵感：先选对「可拍的一条」，再谈爆款与转化
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          选题不是标题党，是<strong>谁 + 什么结果 + 凭什么信你</strong>。下面每条含分类与逻辑说明；要批量出选题包，直接用{" "}
          <Link href={ZH.douyinTopic} className="text-red-800 font-bold hover:underline">
            抖音选题生成器
          </Link>
          。
        </p>

        <section className="mt-10 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">一、选题怎么筛（三条底线）</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700 text-sm leading-relaxed">
            <li>
              <strong>能一句话拍完</strong>：15–45 秒内能交付一个清晰信息点。
            </li>
            <li>
              <strong>人群对位</strong>：前两句让观众觉得「在说给我听」。
            </li>
            <li>
              <strong>有互动抓手</strong>：评论填空、二选一、同城/行业标签，方便二次触达。
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">二、分赛道选题示例（含分类与理由）</h2>
          <ul className="space-y-5">
            {DOUYIN_TOPIC_IDEA_EXAMPLES.map((row, i) => (
              <li key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                <p className="text-xs font-bold text-red-800">{row.niche}</p>
                <p className="mt-2 font-semibold text-slate-900">{row.topic}</p>
                <p className="mt-2 text-slate-700">
                  <span className="font-semibold">分类：</span>
                  {row.category}
                </p>
                <p className="mt-1 text-slate-600">
                  <span className="font-semibold">为什么能跑：</span>
                  {row.whyWorks}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-sm text-amber-950">
          <h2 className="text-lg font-bold">三、从灵感到成片：推荐路径</h2>
          <ol className="mt-3 list-decimal list-inside space-y-2">
            <li>在本页挑 2 条最接近你账号的选题，改成人话。</li>
            <li>
              打开<strong className="text-amber-950">抖音选题生成器</strong>
              （见上文入口）拿多组「选题 + 分类 + 理由」。
            </li>
            <li>
              用{" "}
              <Link href={ZH.douyinHook} className="font-bold underline">
                钩子生成器
              </Link>{" "}
              磨前两句，再用{" "}
              <Link href={ZH.douyinCaption} className="font-bold underline">
                文案包
              </Link>{" "}
              对齐描述区。
            </li>
          </ol>
        </section>

        <DouyinSeoToolLinksStrip />

        <div className="mt-12">
          <DouyinSeoClusterNav current="topicIdeas" />
        </div>

        <p className="mt-8 text-sm text-slate-500">
          回到{" "}
          <Link href={ZH.douyinHub} className="text-red-800 font-medium hover:underline">
            抖音创作者增长中心
          </Link>
          查看完整工作流与工具列表。
        </p>
      </article>
    </main>
  );
}
