import Link from "next/link";
import { ZhDeferredValueProofBlock } from "@/components/zh/ZhDeferredValueProofBlock";
import { ZhPricingLink } from "@/components/monetization/ZhPricingLink";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/tiktok-growth-kit",
  title: zhSeoTitle("短视频增长指南 — 钩子 · 文案 · 标签工作流"),
  description:
    "不是工具清单，而是一套可复盘的短视频工作流：从停滑开头到完整文案包，再到话题标签，帮自媒体提速、提转化。"
});

const workflows: {
  problem: string;
  steps: string[];
  tools: { href: string; label: string }[];
}[] = [
  {
    problem: "播放量起不来——观众 1 秒就划走。",
    steps: [
      "先用「钩子生成器」锁定前两句该怎么开口。",
      "再用「短视频文案包」一次拿口播 + 正文 + 引导 + 标签。",
      "需要拉搜索流量时，用「话题标签生成器」补一层发现。"
    ],
    tools: [
      { href: ZH.douyin, label: "抖音工具首页" },
      { href: ZH.douyinHook, label: "抖音钩子" },
      { href: ZH.hook, label: "通用钩子生成" },
      { href: ZH.tiktokCaption, label: "短视频文案包" },
      { href: "/zh/tools/hashtag-generator", label: "话题标签生成器" }
    ]
  },
  {
    problem: "写稿太慢——拍摄日变成熬夜写词。",
    steps: [
      "用「AI 文案包」先把结构和 CTA 定好。",
      "把口播要点粘进提词器，先拍画面再微调正文。",
      "用「重新生成」换角度，而不是对着空白文档发呆。"
    ],
    tools: [
      { href: ZH.aiCaption, label: "AI 文案包" },
      { href: ZH.tiktokCaption, label: "短视频文案包" }
    ]
  },
  {
    problem: "画面还行，一配字就像说明书。",
    steps: [
      "生成带「为什么能爆」的文案包，理解结构再改口吻。",
      "在工具右侧「爆款结构库」里找同赛道句式。",
      "升级 Pro 换更深策略与更多变体，减少反复改稿。"
    ],
    tools: [
      { href: ZH.tiktokCaption, label: "短视频文案包" },
      { href: ZH.pricing, label: "中文站定价" }
    ]
  },
  {
    problem: "不知道这周发什么——选题空窗。",
    steps: [
      "从下方场景任选一个，打开第一个链接，把粗糙想法粘进去。",
      "在结果里「存为模板」，下次只改一个变量（开头或 CTA）。",
      "下周专门迭代「钩子」或「引导」，别同时改太多。"
    ],
    tools: [
      { href: "/zh/tools/video-idea-generator", label: "视频选题灵感" },
      { href: ZH.tiktokCaption, label: "短视频文案包" }
    ]
  }
];

export default function ZhTikTokGrowthKitPage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1">
        <article className="container pt-10 pb-16 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-800">工作流 · 中文站</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">短视频增长指南</h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            大多数账号不是缺工具，而是<strong>钩子、文案、标签没有串成闭环</strong>。下面按真实场景给你推荐顺序——全部链接都在中文站内完成。
          </p>

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-slate-800">
            <p className="font-semibold text-red-950">主要做抖音？</p>
            <p className="mt-1 text-slate-700">
              先看{" "}
              <Link href={ZH.douyinHub} className="text-red-900 font-bold underline">
                抖音创作者增长中心
              </Link>
              ——工具与示例按抖音语境写，不是海外短视频直译。
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ZhPricingLink
              conversionSource="zh_growth_kit_hero"
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              先看 Pro 权益 →
            </ZhPricingLink>
            <Link
              href={ZH.tiktokCaption}
              className="inline-flex rounded-xl border-2 border-red-400 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-950 hover:bg-red-100"
            >
              从文案包开始 →
            </Link>
            <Link
              href={ZH.home}
              className="inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              返回中文首页
            </Link>
          </div>

          <div className="mt-10">
            <ZhDeferredValueProofBlock variant="growth_kit" locale="zh" />
          </div>

          <section className="mt-12 space-y-10" aria-label="场景工作流">
            {workflows.map((w, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  场景 {i + 1}：{w.problem}
                </h2>
                <ol className="mt-4 space-y-2 list-decimal list-inside text-sm text-slate-700">
                  {w.steps.map((s, j) => (
                    <li key={j} className="pl-1">
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap gap-2">
                  {w.tools.map((t) => (
                    <Link
                      key={t.href}
                      href={t.href}
                      className="inline-flex rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-sm font-medium text-red-900 hover:border-red-300"
                    >
                      {t.label} →
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-12 rounded-2xl border-2 border-red-200 bg-red-50/80 p-6">
            <h2 className="text-lg font-bold text-slate-900">Pro 买的是「更省时间的结果」</h2>
            <p className="mt-2 text-sm text-slate-700">
              免费档给你<strong>精简文案包</strong>；Pro 给你<strong>完整深度</strong>、更多变体，以及更细的发布建议——适合日更、矩阵号和要强转化的带货账号。
            </p>
            <ZhPricingLink
              conversionSource="zh_growth_kit_footer"
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              打开中文站定价 →
            </ZhPricingLink>
          </section>

          <p className="mt-10 text-sm text-slate-500">
            建议把本页收藏为「开工入口」：从场景挑链接，全流程不跳出中文站即可完成选题 → 结构 → 发布。
          </p>
        </article>
      </div>
    </main>
  );
}
