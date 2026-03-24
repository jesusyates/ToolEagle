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

const todayPaths = [
  {
    title: "我要涨粉",
    steps: [
      { href: ZH.douyinHook, label: "1）先写第一版开头钩子" },
      { href: ZH.tiktokCaption, label: "2）生成完整短视频文案包" },
      { href: "/zh/tools/hashtag-generator", label: "3）补话题标签与发现" }
    ]
  },
  {
    title: "我要带货",
    steps: [
      { href: ZH.douyinCaption, label: "1）对齐描述区与转化提示" },
      { href: ZH.douyinCommentCta, label: "2）写评论引导话术" },
      { href: ZH.pricing, label: "3）需要更深变体时看算力包" }
    ]
  },
  {
    title: "我要稳定日更",
    steps: [
      { href: ZH.douyinTopic, label: "1）先填满选题池" },
      { href: ZH.douyinScript, label: "2）把口播要点写进提词器" },
      { href: ZH.douyin, label: "3）回到抖音专栏换场景" }
    ]
  }
] as const;

const workflows: {
  problem: string;
  steps: string[];
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  tools: { href: string; label: string }[];
}[] = [
  {
    problem: "播放量起不来——观众 1 秒就划走。",
    steps: [
      "先用「钩子生成器」锁定前两句该怎么开口。",
      "再用「短视频文案包」一次拿口播 + 正文 + 引导 + 标签。",
      "需要拉搜索流量时，用「话题标签生成器」补一层发现。"
    ],
    primaryCta: { href: ZH.douyinHook, label: "直接生成第一版钩子" },
    secondaryCta: { href: ZH.tiktokCaption, label: "生成完整文案包" },
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
    primaryCta: { href: ZH.tiktokCaption, label: "直接生成完整文案包" },
    secondaryCta: { href: ZH.aiCaption, label: "先用 AI 文案包定结构" },
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
    primaryCta: { href: ZH.tiktokCaption, label: "生成一版可改口吻的文案包" },
    secondaryCta: { href: ZH.pricing, label: "查看算力与权益" },
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
    primaryCta: { href: ZH.douyinTopic, label: "先批量生成选题方向" },
    secondaryCta: { href: "/zh/tools/video-idea-generator", label: "用灵感工具补一条" },
    tools: [
      { href: "/zh/tools/video-idea-generator", label: "视频选题灵感" },
      { href: ZH.tiktokCaption, label: "短视频文案包" }
    ]
  }
];

const nextSteps = [
  { href: ZH.douyin, label: "抖音专栏（按场景找工具）" },
  { href: ZH.douyinHook, label: "抖音钩子生成器" },
  { href: ZH.tiktokCaption, label: "抖音/短视频文案包" },
  { href: ZH.douyinGuide, label: "抖音可执行教程目录" }
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

          <section
            className="sticky top-[4.5rem] z-30 mt-6 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/95 to-white p-3 shadow-sm shadow-amber-900/10 sm:mt-8 sm:p-5"
            aria-label="今日开工路径"
          >
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-amber-900/90">
              今日开工路径
            </p>
            <p className="mt-1 text-center text-[11px] text-slate-600 sm:text-xs">先选一条，2–3 步即可开工</p>
            <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-4 sm:grid-cols-3">
              {todayPaths.map((p) => (
                <div key={p.title} className="rounded-xl border border-amber-100 bg-white/90 p-3">
                  <p className="text-sm font-bold text-slate-900">{p.title}</p>
                  <ul className="mt-2 space-y-1.5">
                    {p.steps.map((s) => (
                      <li key={s.href}>
                        <Link href={s.href} className="text-xs text-red-900 font-medium hover:underline">
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={ZH.tiktokCaption}
              className="inline-flex rounded-xl border-2 border-red-400 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-950 hover:bg-red-100"
            >
              从文案包开始执行 →
            </Link>
            <ZhPricingLink
              conversionSource="zh_growth_kit_hero"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              需要更深结果时看定价
            </ZhPricingLink>
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
                  <Link
                    href={w.primaryCta.href}
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    {w.primaryCta.label} →
                  </Link>
                  {w.secondaryCta ? (
                    <Link
                      href={w.secondaryCta.href}
                      className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      {w.secondaryCta.label} →
                    </Link>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200/80 pt-4">
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

          <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">下一步继续做什么</h2>
            <p className="mt-2 text-sm text-slate-600">
              从下面任一点继续，把「生成」推进到「可发布」。
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {nextSteps.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="inline-flex rounded-xl border border-red-100 bg-red-50/80 px-3 py-2 text-sm font-medium text-red-950 hover:bg-red-100"
                  >
                    {n.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 rounded-2xl border-2 border-red-200 bg-red-50/80 p-6">
            <h2 className="text-lg font-bold text-slate-900">算力买的是「更省时间的结果」</h2>
            <p className="mt-2 text-sm text-slate-700">
              免费档给你<strong>精简文案包</strong>；算力包给你<strong>更深策略与更多变体</strong>，适合日更、矩阵号和要强转化的带货账号。
            </p>
            <ZhPricingLink
              conversionSource="zh_growth_kit_footer"
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              打开中文站定价 →
            </ZhPricingLink>
          </section>

          <p className="mt-10 text-sm text-slate-500">
            建议把本页收藏为开工入口：先选上方路径，再进场景；全流程尽量不跳出中文站。
          </p>
        </article>
      </div>
    </main>
  );
}
