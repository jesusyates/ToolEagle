import Link from "next/link";
import { ZH } from "@/lib/zh-site/paths";

export type DouyinToolSsrSlug =
  | "douyin-topic-generator"
  | "douyin-hook-generator"
  | "douyin-caption-generator"
  | "douyin-structure-generator"
  | "douyin-script-generator"
  | "douyin-comment-cta-generator";

type Block = {
  problem: string;
  scenes: string;
  output: string;
  scenarios: string[];
  fields: string[];
  example: string;
  nextLinks: { href: string; label: string }[];
};

const CONTENT: Record<DouyinToolSsrSlug, Block> = {
  "douyin-topic-generator": {
    problem:
      "适合需要持续发片、但经常被「不知道拍什么」卡住的抖音账号：同城店、知识口播、带货测评等，要把选题从空泛口号变成可执行的拍摄清单。",
    scenes: "日更选题池、同城引流、带货测评前测主题、账号冷启动阶段批量试方向。",
    output:
      "一次生成多条选题方向，并尽量给出分类/赛道标签与「为什么值得拍」的简短理由，便于你筛选后开拍。",
    scenarios: ["周更规划：先填满一周可拍选题", "同一条产品线测多个切入角度", "把模糊想法落成可拍条目"],
    fields: ["选题摘要或列表", "赛道/分类提示", "适合人群或场景", "延伸节奏或互动提示（若有）"],
    example:
      "你是同城美甲店主：想吸引周边咨询，但不想只发优惠券——生成器会按抖音语境给出「可拍、能说清结果」的选题方向，而不是空泛「变美」。",
    nextLinks: [
      { href: "/zh/douyin-hook-generator", label: "去写开头钩子" },
      { href: "/zh/douyin-script-generator", label: "生成口播要点" },
      { href: ZH.douyin, label: "回到抖音工具索引" }
    ]
  },
  "douyin-hook-generator": {
    problem:
      "适合前 1–3 秒决定划走还是停留的抖音内容：需要把「停滑理由」写清楚，再进入正文与拍摄。",
    scenes: "口播开场、带货前贴痛点、剧情类钩子、直播切片引流。",
    output:
      "多组开头句式或钩子变体，便于你 A/B 试播；可与文案包、脚本生成器串联成一条工作流。",
    scenarios: ["同一条主题试多种开场身份", "把产品卖点转译成「人话」钩子", "热点话题里找可拍角度"],
    fields: ["钩子/开场句", "情绪或悬念提示", "与正文衔接建议（若有）"],
    example:
      "带货账号：用「先承认一个尴尬」类开场，再引入产品——生成器按抖音节奏给出可念出来的短句，而不是书面语标题。",
    nextLinks: [
      { href: "/zh/douyin-caption-generator", label: "生成正文与描述区" },
      { href: "/zh/douyin-structure-generator", label: "要整条内容结构" },
      { href: ZH.growthKit, label: "查看开工工作流" }
    ]
  },
  "douyin-caption-generator": {
    problem:
      "适合要把「拍完之后的描述区、引导私信/下单」写清楚的抖音创作者：尤其是带货、同城到店、线索类账号。",
    scenes: "短视频发布后补全描述文案、活动期统一话术、评论区引导前置写作。",
    output:
      "结构化文案与互动/转化提示，便于直接粘贴到抖音描述与置顶评论策略里（具体字段以页面结果为准）。",
    scenarios: ["把同一产品卖点拆成多条描述区版本", "同城活动期统一更新话术", "补充话题标签与行动号召"],
    fields: ["正文/描述文案", "互动或转化提示", "话题标签建议", "节奏或发布提示（若有）"],
    example:
      "同城餐饮：突出「到店可验证」的承诺与一条清晰的私信/预约引导，避免描述区堆满与画面无关的关键词。",
    nextLinks: [
      { href: "/zh/douyin-comment-cta-generator", label: "写评论引导话术" },
      { href: "/zh/douyin-structure-generator", label: "对齐整支结构" },
      { href: ZH.douyinHub, label: "抖音增长中心" }
    ]
  },
  "douyin-structure-generator": {
    problem:
      "适合一支视频里要「起承转合」清晰：开场抓人、中段举证、结尾引导，减少写到一半结构散掉。",
    scenes: "口播知识、测评对比、剧情反转、带货演示片。",
    output:
      "分段结构（如开头/中段/结尾）与每段要完成的任务，便于你对照提词器或分镜拍摄。",
    scenarios: ["把 60 秒讲清楚一个方法", "测评类「结论前置」结构", "带货类「痛点—演示—承诺」结构"],
    fields: ["段落结构名称", "每段要完成的任务", "过渡或节奏提示（若有）"],
    example:
      "知识口播：先给「这一分钟你能带走什么」，再展开步骤，最后用一句可执行行动收尾——结构层会先帮你对齐顺序再细化措辞。",
    nextLinks: [
      { href: "/zh/douyin-script-generator", label: "生成口播要点" },
      { href: "/zh/douyin-hook-generator", label: "强化开头钩子" },
      { href: ZH.growthKit, label: "增长指南（工作流）" }
    ]
  },
  "douyin-script-generator": {
    problem:
      "适合要对着镜头一口气说清楚：先定要点再润色口吻，减少「背稿不像说话」的问题。",
    scenes: "口播讲解、轻剧情对话要点、带货演示时的讲解顺序。",
    output:
      "按抖音语境整理的口播要点/分镜提示（具体字段以页面结果为准），可粘贴到提词器再按个人口吻微调。",
    scenarios: ["把长文章压成 45 秒口播", "同一主题多版本语气（稳/快/亲和）", "带货讲解按「演示顺序」列要点"],
    fields: ["分段口播要点", "关键词或语气提示", "结尾引导或 CTA（若有）"],
    example:
      "实体门店：口播里先交代「你是谁、在哪、帮谁解决什么」，再讲证据与行动——先生成要点，再回钩子工具收紧前两句。",
    nextLinks: [
      { href: "/zh/douyin-hook-generator", label: "收紧开场两句" },
      { href: "/zh/douyin-caption-generator", label: "写描述区文案" },
      { href: ZH.douyin, label: "更多抖音工具" }
    ]
  },
  "douyin-comment-cta-generator": {
    problem:
      "适合要用评论区完成私信、预约、领券、加群等下一步的账号：把「怎么说才不硬广」写清楚。",
    scenes: "置顶评论话术、引导私信、活动报名、直播间回放下的统一引导。",
    output:
      "多组评论引导/互动话术变体，便于你选一条与视频口径一致地使用（具体字段以页面结果为准）。",
    scenarios: ["避免重复置顶文案被折叠感知为骚扰", "同城线索类引导加微信/预约", "带货类问「你最卡的一步」促互动"],
    fields: ["评论引导句", "互动或转化提示", "备用句式（若有）"],
    example:
      "线索类：用「一个具体问题」换评论，比直接甩联系方式更像正常互动；生成器会按抖音语境给多种说法。",
    nextLinks: [
      { href: "/zh/douyin-caption-generator", label: "对齐描述区话术" },
      { href: "/zh/douyin-hook-generator", label: "回看开头是否一致" },
      { href: ZH.tiktokCaption, label: "短视频文案包" }
    ]
  }
};

export function ZhDouyinToolIntro({ slug }: { slug: DouyinToolSsrSlug }) {
  const c = CONTENT[slug];
  return (
    <section
      className="border-b border-slate-800/80 bg-slate-900/40 px-4 py-8 md:py-10"
      aria-labelledby={`douyin-tool-intro-${slug}`}
    >
      <div className="container max-w-3xl">
        <h2 id={`douyin-tool-intro-${slug}`} className="text-lg font-bold text-slate-100 md:text-xl">
          这个工具帮你解决什么
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{c.problem}</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          <li>
            <span className="font-semibold text-slate-200">适合哪些抖音场景：</span>
            {c.scenes}
          </li>
          <li>
            <span className="font-semibold text-slate-200">结果大致包含：</span>
            {c.output}
          </li>
        </ul>
      </div>
    </section>
  );
}

export function ZhDouyinToolSsrFooter({ slug }: { slug: DouyinToolSsrSlug }) {
  const c = CONTENT[slug];
  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-10 md:py-12" aria-labelledby={`douyin-tool-more-${slug}`}>
      <div className="container max-w-3xl space-y-10 text-slate-800">
        <div>
          <h2 id={`douyin-tool-more-${slug}`} className="text-lg font-bold text-slate-900">
            适用场景
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
            {c.scenarios.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">输出字段说明</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {c.fields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">抖音语境示例</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{c.example}</p>
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">下一步推荐</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {c.nextLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
                >
                  {l.label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
