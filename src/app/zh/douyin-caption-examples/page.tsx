import Link from "next/link";
import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";
import { DouyinSeoClusterNav } from "@/components/zh/cn-platforms/DouyinSeoClusterNav";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { ZH } from "@/lib/zh-site/paths";
import { DOUYIN_CAPTION_PATTERNS, DOUYIN_CTA_LINES } from "@/lib/zh-site/douyin-example-library";
import { DouyinSeoToolLinksStrip } from "@/components/zh/cn-platforms/DouyinSeoToolLinksStrip";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-caption-examples",
  title: zhSeoTitle("抖音文案范例 & 描述区公式 — 评论私信转化 · 爆款结构"),
  description:
    "抖音描述区怎么写？整理带货、情绪、干货、IP、娱乐等文案公式与范例，附转化/互动提示；链接抖音文案包生成器，一次生成钩子+口播+正文+引导。"
});

export default function ZhDouyinCaptionExamplesPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <article className="flex-1 container pt-10 pb-16 max-w-3xl">
        <div className="mb-6">
          <ZhDouyinTrafficInjectionBanner />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-800">抖音 SEO · 文案</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
          抖音文案范例：描述区公式、评论钩子与转化话术
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          描述区不是正片复述，而是<strong>把口播里没说完的那半步讲清楚</strong>：谁适合、下一步做什么、评论留什么关键词。下面按赛道给公式 + 范例 + 转化提示；要一键出全套文案块，直接用{" "}
          <Link href={ZH.douyinCaption} className="text-red-800 font-bold hover:underline">
            抖音文案包生成器
          </Link>
          。
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">一、好文案的三个共同点</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700 text-sm leading-relaxed">
            <li>
              <strong>人群对位</strong>：第一句让读者觉得「在说给我听」。
            </li>
            <li>
              <strong>可执行下一步</strong>：收藏 / 评论关键词 / 私信领什么，写清楚。
            </li>
            <li>
              <strong>与开头一致</strong>：描述区第一句尽量与口播钩子同向，减少跳失。
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">二、分赛道公式 + 范例（可复制改写）</h2>
          <ul className="space-y-5">
            {DOUYIN_CAPTION_PATTERNS.map((c, i) => (
              <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <p className="text-xs font-bold text-red-800">{c.niche}</p>
                <p className="mt-2 font-semibold text-slate-900">{c.pattern}</p>
                <p className="mt-2 text-slate-800">{c.example}</p>
                <p className="mt-2 text-slate-600">
                  <span className="font-semibold text-slate-800">转化 / 互动：</span>
                  {c.convertTip}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-3">三、高互动结尾句式（引导评论）</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {DOUYIN_CTA_LINES.map((line, i) => (
              <li key={i} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-sky-200 bg-sky-50/50 p-5 text-sm">
          <h2 className="text-lg font-bold text-sky-950">四、下一步：成套生成</h2>
          <p className="mt-2 text-sky-900">
            单条描述区可以抄公式；要<strong>钩子 + 口播要点 + 正文 + 引导 + 标签</strong>一次对齐，用
            <strong className="text-sky-950"> 抖音文案包生成器</strong>
            （见上文入口）。需要口播分镜，可配合{" "}
            <Link href={ZH.douyinScript} className="font-bold underline">
              口播脚本生成器
            </Link>{" "}
            与{" "}
            <Link href={ZH.douyinScriptTemplatesSeo} className="font-bold underline">
              口播脚本模板页
            </Link>
            。
          </p>
        </section>

        <DouyinSeoToolLinksStrip />

        <div className="mt-12">
          <DouyinSeoClusterNav current="captions" />
        </div>

        <p className="mt-8 text-sm text-slate-500">
          更多开头句式见{" "}
          <Link href={ZH.douyinHooksSeo} className="text-red-800 font-medium hover:underline">
            抖音钩子模板库
          </Link>
          。
        </p>
      </article>
    </main>
  );
}
