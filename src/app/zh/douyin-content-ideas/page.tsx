import Link from "next/link";
import { DouyinSeoClusterNav } from "@/components/zh/cn-platforms/DouyinSeoClusterNav";
import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-content-ideas",
  title: zhSeoTitle("抖音内容选题灵感 — 可拍方向 · 结构 · 转化抓手"),
  description:
    "抖音发什么内容更容易进池？按「人群对位 + 单信息点 + 可评论抓手」拆选题；内链选题生成器、钩子与完整文案包，留在站内闭环。适合同城、带货与知识口播账号。",
  keywords: ["抖音选题", "抖音内容方向", "短视频选题", "抖音运营", "爆款结构"]
});

const angleExamples = [
  {
    angle: "同城服务",
    idea: "同城用户最常踩的一个坑 + 你用一句话怎么帮他避坑",
    why: "地理与场景标签清晰，评论里容易出真实线索。"
  },
  {
    angle: "带货测评",
    idea: "同一价位两件货，只比「一个可验证指标」",
    why: "减少形容词堆叠，观众更愿意看完并问链接。"
  },
  {
    angle: "知识口播",
    idea: "把一个概念拆成「错误示范 → 正确一句 → 立刻能用」",
    why: "结构固定，日更成本低，完播更稳。"
  }
];

export default function ZhDouyinContentIdeasPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <article className="flex-1 container pt-10 pb-16 max-w-3xl">
        <div className="mb-6">
          <ZhDouyinTrafficInjectionBanner />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-800">抖音 SEO · 内容选题</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
          抖音内容选题灵感：先定「角度」，再定脚本与钩子
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          「发什么」比「怎么写」更靠前：下面用三种常见账号角度举例；要一次生成多组选题包，直接用{" "}
          <Link href={ZH.douyinTopic} className="text-red-800 font-bold hover:underline">
            抖音选题生成器
          </Link>
          ，再接到钩子与文案包。
        </p>

        <section className="mt-10 space-y-6">
          <h2 className="text-xl font-bold text-slate-900">一、选题＝谁 + 什么结果 + 凭什么信你</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            前 1–2 秒要把「对号入座」说清楚；中段只讲一个主信息点；结尾留可执行的评论或私信引导。同一套骨架可日更，换角度即可。
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">二、三种角度的可拍灵感（含理由）</h2>
          <ul className="space-y-5">
            {angleExamples.map((row) => (
              <li key={row.angle} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                <p className="text-xs font-bold text-red-800">{row.angle}</p>
                <p className="mt-2 font-semibold text-slate-900">{row.idea}</p>
                <p className="mt-2 text-slate-600">
                  <span className="font-semibold">为什么能跑：</span>
                  {row.why}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-sm text-amber-950">
          <h2 className="text-lg font-bold">三、从灵感到成片：推荐路径</h2>
          <ol className="mt-3 list-decimal list-inside space-y-2">
            <li>在本页选 1 个角度，把「idea」改成你的人设与场景。</li>
            <li>
              打开<strong className="text-amber-950">抖音选题生成器</strong>
              （见上文入口）拿多组选题 + 分类 + 理由。
            </li>
            <li>
              用{" "}
              <Link href={ZH.douyinHook} className="font-bold underline">
                钩子生成器
              </Link>{" "}
              磨开头，再用{" "}
              <Link href={ZH.douyinCaption} className="font-bold underline">
                文案包
              </Link>{" "}
              对齐描述区与评论引导。
            </li>
          </ol>
        </section>

        <div className="mt-12">
          <DouyinSeoClusterNav current="contentIdeas" />
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
