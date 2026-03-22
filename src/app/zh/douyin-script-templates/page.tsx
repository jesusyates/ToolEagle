import Link from "next/link";
import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";
import { DouyinSeoClusterNav } from "@/components/zh/cn-platforms/DouyinSeoClusterNav";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";
import { DOUYIN_SCRIPT_BEATS } from "@/lib/zh-site/douyin-example-library";
import { DouyinSeoToolLinksStrip } from "@/components/zh/cn-platforms/DouyinSeoToolLinksStrip";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-script-templates",
  title: zhSeoTitle("抖音口播脚本模板 — 分镜气口 · 完播与转化"),
  description:
    "抖音口播脚本怎么写？按带货、情绪、干货、IP、娱乐整理分镜气口与「为什么这段能拉完播/转化」；链接抖音口播脚本生成器，直接生成可提词器使用的结构。"
});

export default function ZhDouyinScriptTemplatesPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <article className="flex-1 container pt-10 pb-16 max-w-3xl">
        <div className="mb-6">
          <ZhDouyinTrafficInjectionBanner />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-800">抖音 SEO · 口播</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
          抖音口播脚本模板：按镜头拆气口，先完播再谈转化
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          口播不是作文，是<strong>每 5–10 秒一个气口</strong>，让观众跟得上、愿意看完。下面把常见赛道拆成可拍的段落，并说明「为什么这段能拉完播/转化」。要自动生成多版，直接用{" "}
          <Link href={ZH.douyinScript} className="text-red-800 font-bold hover:underline">
            抖音口播脚本生成器
          </Link>
          。
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">一、口播脚本的底层顺序</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            大多数能转化的抖音口播，都逃不开：<strong>停滑 → 建立信任/情绪 → 讲清方法或卖点 → 上证据 → 收口指令</strong>。
            不同赛道只是每段篇幅不同：带货更重「证据」，情绪更重「命名」，娱乐更重「节奏与梗」。
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">二、分镜气口模板（含「为什么能爆」）</h2>
          <ol className="space-y-4">
            {DOUYIN_SCRIPT_BEATS.map((s, i) => (
              <li
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white bg-red-700 rounded-full px-2 py-0.5">{i + 1}</span>
                  <span className="text-xs font-bold text-red-900">{s.niche}</span>
                  <span className="font-semibold text-slate-900">{s.beat}</span>
                </div>
                <p className="mt-2 text-slate-800">{s.hint}</p>
                <p className="mt-2 text-slate-700">
                  <span className="font-semibold text-red-900">为什么能爆 / 能转化：</span>
                  {s.whyWorks}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 rounded-2xl border border-violet-200 bg-violet-50/40 p-5 text-sm text-violet-950">
          <h2 className="text-lg font-bold">三、拍完以后：文案与开头对齐</h2>
          <p className="mt-2">
            口播定稿后，描述区与钩子最好用同一套「人群 + 承诺 + 指令」。可用{" "}
            <Link href={ZH.douyinCaption} className="font-bold underline">
              文案包生成器
            </Link>{" "}
            对齐；开头单独打磨可再看{" "}
            <Link href={ZH.douyinHooksSeo} className="font-bold underline">
              钩子模板库
            </Link>
            。
          </p>
        </section>

        <DouyinSeoToolLinksStrip />

        <div className="mt-12">
          <DouyinSeoClusterNav current="scripts" />
        </div>

        <p className="mt-8 text-sm text-slate-500">
          返回{" "}
          <Link href={ZH.douyinHub} className="text-red-800 font-medium hover:underline">
            抖音创作者增长中心
          </Link>
          查看闭环工作流。
        </p>
      </article>
    </main>
  );
}
