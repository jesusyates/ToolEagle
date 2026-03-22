import Link from "next/link";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

const GUIDES = [
  {
    href: ZH.douyinGuideHowToGetViews,
    title: "抖音怎么拿播放：进池与测试",
    desc: "先搞清「谁要看、凭什么信、看完做什么」，再谈爆款。"
  },
  {
    href: ZH.douyinGuideHookFormula,
    title: "爆款钩子公式（可套用）",
    desc: "前两秒停滑：身份、结果、悬念、对号入座。"
  },
  {
    href: ZH.douyinGuideScriptTemplate,
    title: "口播脚本骨架（分段 + 气口）",
    desc: "把一条视频拆成可拍的节奏，而不是作文。"
  },
  {
    href: ZH.douyinGuideCaptionTemplate,
    title: "描述区文案模板（含标签）",
    desc: "描述区补半步：人群、指令、话题，不对重复述正片。"
  },
  {
    href: ZH.douyinGuideGrowthStrategy,
    title: "账号增长策略（可执行清单）",
    desc: "日更、测试、复盘：把随机爆款变成可复制流程。"
  }
] as const;

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin-guide",
  title: zhSeoTitle("抖音教程 — 可执行方法论 · 配套生成器"),
  description:
    "抖音创作操作系统教程目录：播放、钩子、口播、描述区与账号增长；每篇含结构与示例，并内链抖音专属工具。"
});

export default function ZhDouyinGuideIndexPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">

      <div className="flex-1 container max-w-3xl px-4 py-10 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-800">抖音 · 教程</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">可执行教程</h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          下面每篇都按<strong>结构 → 示例 → 工具</strong>写，读完可直接进生成器出稿。更多长尾可读素材见{" "}
          <Link href={ZH.douyinTutorials} className="font-semibold text-red-800 hover:underline">
            教程索引
          </Link>
          。
        </p>

        <ul className="mt-10 space-y-4">
          {GUIDES.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="block rounded-2xl border border-slate-200 bg-slate-50/60 px-5 py-4 transition hover:border-red-200 hover:bg-red-50/30"
              >
                <span className="font-bold text-slate-900">{g.title}</span>
                <span className="mt-1 block text-sm text-slate-600">{g.desc}</span>
                <span className="mt-2 inline-block text-sm font-semibold text-red-800">阅读 →</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-sm text-slate-500">
          <Link href={ZH.douyin} className="font-medium text-red-800 hover:underline">
            ← 抖音创作入口
          </Link>
        </p>
      </div>

    </main>
  );
}
