import Link from "next/link";
import { ZhPricingLink } from "@/components/monetization/ZhPricingLink";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { zhSeoTitle } from "@/config/zh-brand";
import { DouyinEducationBlocks } from "@/components/zh/cn-platforms/DouyinEducationBlocks";
import { DouyinExamplePatterns } from "@/components/zh/cn-platforms/DouyinExamplePatterns";
import { DouyinSeoClusterNav } from "@/components/zh/cn-platforms/DouyinSeoClusterNav";
import { CN_PLATFORMS } from "@/lib/zh-site/cn-platforms/config";
import { DouyinExternalDistributionBlocks } from "@/components/zh/DouyinExternalDistributionBlocks";
import { DouyinWorkstationSummaryFooter } from "@/components/zh/cn-platforms/DouyinWorkstationSummaryFooter";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/douyin/hub",
  title: zhSeoTitle("抖音涨粉与爆款文案工作台 — 钩子 · 口播 · 转化工作流"),
  description:
    "抖音怎么涨粉、怎么做爆款开头、怎么把播放变成评论和私信？站内钩子/文案包/口播工具 + 模板库与 SEO 文章集群，按抖音完播、同城与带货语境写，不是泛 AI 演示。分享链接带完整标题与描述预览。",
  keywords: ["抖音运营", "抖音爆款", "抖音钩子", "口播脚本", "带货短视频", "抖音文案"]
});

const painPoints = [
  {
    title: "不涨粉：不是没更新，是开头没让人「对号入座」",
    detail: "同城、带货、知识三类账号，前 1–2 秒没把「你是谁 + 你能帮观众得到什么结果」说死，很难进更大流量池，更别说私信转化。"
  },
  {
    title: "不出爆款：结构散、信息堆，完播先掉",
    detail: "要的是可复制骨架：钩子 → 放大痛点 → 少步骤 → 上证据 → 收口互动；一次生成多版，专测开头与评论钩子。"
  },
  {
    title: "有播放没钱：引导太虚，转化链路断在描述区",
    detail: "把「评论什么 / 私信领什么 / 到店说什么」写进可执行指令，比空喊「点赞关注」更接近真实变现。"
  }
];

const workflows = [
  {
    name: "新号冷启动：先打标签再拉深度",
    steps: [
      "用「抖音钩子生成器」固定你的人群与场景，连拍 5 条只改开头。",
      "用「抖音口播脚本生成器」把一条视频拆成可拍的五段气口。",
      "描述区用「抖音文案包」对齐口播，并加一条可评论的选择题。"
    ]
  },
  {
    name: "带货/同城：把「为什么点你」说在前面",
    steps: [
      "钩子直接承诺可验证的结果（预约、到店、对比价、前后差异）。",
      "口播中段只讲一个主卖点，用画面完成「证明」而不是堆形容词。",
      "结尾引导评论城市/行业/预算区间，方便二次触达与私信话术。"
    ]
  }
];

export default function ZhDouyinHubPage() {
  const xhs = CN_PLATFORMS.xiaohongshu;
  const ks = CN_PLATFORMS.kuaishou;

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1">
        <article className="container pt-8 pb-16 max-w-3xl">
          <nav className="mb-6 text-sm" aria-label="面包屑">
            <Link href={ZH.douyin} className="text-red-800 font-medium hover:underline">
              ← 抖音 · 工具
            </Link>
            <span className="text-slate-300 mx-2">/</span>
            <Link href={ZH.douyinTutorials} className="text-red-800 font-medium hover:underline">
              教程
            </Link>
          </nav>
          <p className="text-xs font-semibold uppercase tracking-widest text-red-800">抖音 · 中文站专栏 · 工作台</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">抖音涨粉 · 爆款文案 · 转化工作台</h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            专注<strong>涨粉、爆款结构、评论/私信转化</strong>：示例与工具都按抖音语境写，不是「AI 写两句」演示。本页聚合模板长文、选题/钩子灵感与六套生成器；入口见下方「专栏工具」与「模板长文」，链接全部在 /zh 站内完成闭环。
          </p>

          <section className="mt-12" aria-labelledby="douyin-pain">
            <h2 id="douyin-pain" className="text-lg font-bold text-slate-900">
              做抖音最常卡的三件事（涨粉 · 爆款 · 赚钱）
            </h2>
            <ul className="mt-4 space-y-4">
              {painPoints.map((p) => (
                <li key={p.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">{p.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="douyin-workflow">
            <h2 id="douyin-workflow" className="text-lg font-bold text-slate-900">
              推荐工作流（站内闭环）
            </h2>
            <div className="mt-4 space-y-6">
              {workflows.map((w) => (
                <div key={w.name} className="rounded-2xl border border-red-100 bg-red-50/30 p-6">
                  <h3 className="font-bold text-red-950">{w.name}</h3>
                  <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-slate-800">
                    {w.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12" aria-labelledby="douyin-tools">
            <h2 id="douyin-tools" className="text-lg font-bold text-slate-900">
              专栏工具（抖音语境）
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-1">
              <Link
                href={ZH.douyinCaption}
                className="block rounded-2xl border border-slate-200 p-5 hover:border-red-200 hover:bg-red-50/40 transition"
              >
                <p className="text-xs font-bold text-red-800">文案包</p>
                <p className="mt-1 font-semibold text-slate-900">抖音文案包生成器</p>
                <p className="mt-2 text-sm text-slate-600">
                  钩子、口播要点、正文、引导与标签一次生成，描述区可与口播对齐，适合日更与矩阵。
                </p>
              </Link>
              <Link
                href={ZH.douyinHook}
                className="block rounded-2xl border border-slate-200 p-5 hover:border-red-200 hover:bg-red-50/40 transition"
              >
                <p className="text-xs font-bold text-red-800">开头</p>
                <p className="mt-1 font-semibold text-slate-900">抖音钩子生成器</p>
                <p className="mt-2 text-sm text-slate-600">专攻前两句：身份锚定、结果前置、同城/带货可用的停滑句式。</p>
              </Link>
              <Link
                href={ZH.douyinScript}
                className="block rounded-2xl border border-slate-200 p-5 hover:border-red-200 hover:bg-red-50/40 transition"
              >
                <p className="text-xs font-bold text-red-800">口播</p>
                <p className="mt-1 font-semibold text-slate-900">抖音口播脚本生成器</p>
                <p className="mt-2 text-sm text-slate-600">按「钩子—放大—步骤—证据—互动」拆气口，方便提词器直录。</p>
              </Link>
              <Link
                href={ZH.douyinTopic}
                className="block rounded-2xl border border-slate-200 p-5 hover:border-red-200 hover:bg-red-50/40 transition"
              >
                <p className="text-xs font-bold text-red-800">选题</p>
                <p className="mt-1 font-semibold text-slate-900">抖音选题生成器</p>
                <p className="mt-2 text-sm text-slate-600">批量选题想法 + 赛道分类 + 为什么适合抖音完播与评论。</p>
              </Link>
              <Link
                href={ZH.douyinCommentCta}
                className="block rounded-2xl border border-slate-200 p-5 hover:border-red-200 hover:bg-red-50/40 transition"
              >
                <p className="text-xs font-bold text-red-800">评论</p>
                <p className="mt-1 font-semibold text-slate-900">抖音评论引导生成器</p>
                <p className="mt-2 text-sm text-slate-600">置顶互动句、接龙话术与促评触发，拉高评论与复播。</p>
              </Link>
              <Link
                href={ZH.douyinStructure}
                className="block rounded-2xl border border-slate-200 p-5 hover:border-red-200 hover:bg-red-50/40 transition"
              >
                <p className="text-xs font-bold text-red-800">结构</p>
                <p className="mt-1 font-semibold text-slate-900">抖音内容结构生成器</p>
                <p className="mt-2 text-sm text-slate-600">开头钩子、中段内容流、结尾 CTA 一条拆清。</p>
              </Link>
            </div>
          </section>

          <section className="mt-12" aria-labelledby="douyin-monetize">
            <h2 id="douyin-monetize" className="text-lg font-bold text-slate-900">
              免费验证选题 · 算力包拿「能拍、能发、能复盘」的完整包
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              抖音工具免费档用于<strong>快速试方向</strong>；需要<strong>更高 AI 算力次数、更完整结果、更多变体与策略拆解</strong>时，购买算力包更适合日更与持续做内容。支付走微信/支付宝，自动开通。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ZhPricingLink
                hash="#cn-credits-checkout"
                conversionSource="zh_douyin_hub_section"
                className="inline-flex rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800"
              >
                查看算力包定价与开通 →
              </ZhPricingLink>
            </div>
          </section>

          <div className="mt-12 space-y-10">
            <DouyinExamplePatterns variant="hub" />
            <DouyinEducationBlocks />
          </div>

          <section className="mt-12" aria-labelledby="douyin-seo-lib">
            <h2 id="douyin-seo-lib" className="text-lg font-bold text-slate-900">
              模板长文（SEO）· 可先收藏再进生成器
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              覆盖「爆款开头、描述区转化、口播气口」三类搜索词；每页都有可套用句式，并链回工具。
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={ZH.douyinHooksSeo} className="text-red-800 font-semibold hover:underline">
                  抖音钩子开头模板 &amp; 爆款句式
                </Link>
                <span className="text-slate-600"> — 为什么这个开头能爆 + 案例向参考</span>
              </li>
              <li>
                <Link href={ZH.douyinCaptionExamplesSeo} className="text-red-800 font-semibold hover:underline">
                  抖音文案范例 &amp; 描述区公式
                </Link>
                <span className="text-slate-600"> — 评论/私信转化提示</span>
              </li>
              <li>
                <Link href={ZH.douyinScriptTemplatesSeo} className="text-red-800 font-semibold hover:underline">
                  抖音口播脚本模板
                </Link>
                <span className="text-slate-600"> — 分镜气口 + 完播/转化说明</span>
              </li>
              <li>
                <Link href={ZH.douyinTopicIdeasSeo} className="text-red-800 font-semibold hover:underline">
                  抖音选题灵感 &amp; 可拍方向
                </Link>
                <span className="text-slate-600"> — 分类 + 为什么能跑 + 链回选题生成器</span>
              </li>
              <li>
                <Link href={ZH.douyinContentIdeasSeo} className="text-red-800 font-semibold hover:underline">
                  抖音内容选题灵感
                </Link>
                <span className="text-slate-600"> — 角度 + 可拍方向 + 转化抓手</span>
              </li>
              <li>
                <Link href={ZH.douyinViralHooksLongTail} className="text-red-800 font-semibold hover:underline">
                  抖音爆款钩子灵感
                </Link>
                <span className="text-slate-600"> — 停滑句式 + 场景说明</span>
              </li>
            </ul>
            <div className="mt-6">
              <DouyinSeoClusterNav current="hub" />
            </div>
          </section>

          <DouyinExternalDistributionBlocks />

          <section className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm text-slate-600">
            <p className="font-bold text-slate-800">后续平台（占位，尚未上线）</p>
            <p className="mt-2">
              将按同一套路扩展：<strong>{xhs.labelZh}</strong>（{xhs.hubPath}）、<strong>{ks.labelZh}</strong>（{ks.hubPath}
              ）。路由与配置见 <code className="text-xs bg-white px-1 rounded">src/lib/zh-site/cn-platforms/config.ts</code>。
            </p>
          </section>

          <p className="mt-10 text-sm text-slate-500">
            更多通用短视频工作流也可对照{" "}
            <Link href={ZH.growthKit} className="text-red-800 font-medium hover:underline">
              中文站增长指南
            </Link>
            ；若你主要做抖音，优先收藏本专栏。
          </p>

          <div className="mt-12">
            <DouyinWorkstationSummaryFooter />
          </div>
        </article>
      </div>
    </main>
  );
}
