import Link from "next/link";
import { DouyinSeoClusterNav } from "@/components/zh/cn-platforms/DouyinSeoClusterNav";
import { ZhDouyinTrafficInjectionBanner } from "@/components/zh/ZhDouyinTrafficInjectionBanner";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-viral-hooks",
  title: zhSeoTitle("抖音爆款钩子灵感 — 停滑开头 · 可复用句式"),
  description:
    "抖音前 1–2 秒怎么停滑？整理可复用钩子类型、示例句式与「别踩坑」；内链钩子生成器、选题与文案包，按完播与转化写，不是泛 AI 套话。",
  keywords: ["抖音钩子", "爆款开头", "停滑", "短视频钩子", "抖音文案", "完播率"]
});

const hookPatterns = [
  {
    name: "结果前置",
    line: "我只用这一招，把同城咨询从 0 拉到稳定私信——",
    note: "先给可验证结果，再展开过程，适合同城与带货。"
  },
  {
    name: "反常识",
    line: "别再按教程顺序拍了，抖音更吃「先给结论」——",
    note: "打破预期，观众会多停留两秒听你解释。"
  },
  {
    name: "选择题",
    line: "预算只有 500，你选「效果快」还是「更省心」？我直接给答案——",
    note: "评论里容易出真实互动，方便二次触达。"
  }
];

export default function ZhDouyinViralHooksPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <article className="flex-1 container pt-10 pb-16 max-w-3xl">
        <div className="mb-6">
          <ZhDouyinTrafficInjectionBanner />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-800">抖音 SEO · 爆款钩子</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
          抖音爆款钩子灵感：停滑不是喊口号，是「下一句必须听」
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          钩子要和选题、口播结构对齐；下面给三种常见「停滑类型」示例。要批量生成多版钩子，直接用{" "}
          <Link href={ZH.douyinHook} className="text-red-800 font-bold hover:underline">
            抖音钩子生成器
          </Link>
          ，再接到脚本与文案包。
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">一、钩子自检（两条）</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700 text-sm leading-relaxed">
            <li>
              <strong>人群对位</strong>：前两句是否让观众觉得「在说给我听」。
            </li>
            <li>
              <strong>信息承诺</strong>：是否预告了「下一句会兑现的具体信息」，而不是空泛情绪。
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">二、三种可复用句式（含使用场景）</h2>
          <ul className="space-y-5">
            {hookPatterns.map((row) => (
              <li key={row.name} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                <p className="text-xs font-bold text-red-800">{row.name}</p>
                <p className="mt-2 font-semibold text-slate-900 whitespace-pre-wrap">{row.line}</p>
                <p className="mt-2 text-slate-600">
                  <span className="font-semibold">适用：</span>
                  {row.note}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-red-100 bg-red-50/40 p-5 text-sm text-red-950">
          <h2 className="text-lg font-bold">三、更多模板与工具</h2>
          <p className="mt-2 leading-relaxed">
            系统化模板见{" "}
            <Link href={ZH.douyinHooksSeo} className="font-bold underline">
              钩子模板库
            </Link>
            ；与{" "}
            <Link href={ZH.douyinTopicIdeasSeo} className="font-bold underline">
              选题灵感库
            </Link>
            、
            <Link href={ZH.douyinContentIdeasSeo} className="font-bold underline">
              内容选题灵感
            </Link>
            搭配使用，整条链路留在 /zh 站内。
          </p>
        </section>

        <div className="mt-12">
          <DouyinSeoClusterNav current="viralHooksLong" />
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
