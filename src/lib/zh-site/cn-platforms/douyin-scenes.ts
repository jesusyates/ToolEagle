import { ZH } from "@/lib/zh-site/paths";

/** 抖音专栏：按场景聚合（不出现「工具分类 / 教程分类」用语） */
export type DouyinSceneLink = { href: string; label: string };

export type DouyinSceneBlock = {
  id: string;
  title: string;
  description: string;
  /** 抖音专属生成器 */
  tools: DouyinSceneLink[];
  /** 可执行教程（/zh/douyin-guide/*） */
  guides: DouyinSceneLink[];
  /** 范例库、SEO 长文、索引 */
  reads: DouyinSceneLink[];
  /** 真实抖音语境短句（展示用） */
  examples: string[];
};

/** `/zh/douyin/tools`：历史通用工具入口（非抖音命名，单独页聚合） */
export const DOUYIN_MULTI_PLATFORM_TOOL_PAGES: DouyinSceneLink[] = [
  { href: "/zh/tools/title-generator", label: "标题生成器" },
  { href: "/zh/tools/idea-generator", label: "选题生成器" },
  { href: "/zh/tools/hashtag-generator", label: "话题标签生成器" },
  { href: "/zh/tools/script-generator", label: "脚本生成器" },
  { href: "/zh/tools/video-idea-generator", label: "视频选题生成器" },
  { href: "/zh/tools/instagram-caption-generator", label: "Instagram 文案生成器" },
  { href: "/zh/tools/reels-caption-generator", label: "Reels 文案生成器" },
  { href: "/zh/tools/youtube-title-generator", label: "YouTube 标题生成器" },
  { href: "/zh/tools/youtube-description-generator", label: "YouTube 描述生成器" },
  { href: "/zh/tools/tiktok-bio-generator", label: "TikTok 简介生成器" }
];

/** V109 — 五大固定支柱（抖音创作操作系统） */
export const DOUYIN_SCENES: DouyinSceneBlock[] = [
  {
    id: "traffic",
    title: "获取流量（流量增长）",
    description: "选题、开头与爆款钩子：先把人留住，再谈进池与转化。",
    tools: [
      { href: ZH.douyinTopic, label: "抖音选题生成器" },
      { href: ZH.douyinHook, label: "抖音钩子生成器" }
    ],
    guides: [
      { href: ZH.douyinGuideHowToGetViews, label: "抖音怎么拿播放：进池与测试" },
      { href: ZH.douyinGuideHookFormula, label: "爆款钩子公式（可套用）" }
    ],
    reads: [
      { href: ZH.douyinTopicIdeasSeo, label: "选题灵感与可拍方向" },
      { href: ZH.douyinViralHooksLongTail, label: "爆款钩子灵感库" },
      { href: ZH.douyinContentIdeasSeo, label: "内容选题灵感" },
      { href: ZH.douyinHooksSeo, label: "钩子开头模板与句式" }
    ],
    examples: [
      "同城美甲：别一上来就拍门头——先拍「为什么这条街就你家排队」。",
      "知识口播：别再堆干货——先让观众对号入座：你是不是也卡在第三秒就划走？",
      "带货测评：同样价位，我把卖点换成「你最怕踩的坑」——评论区立刻有人接话。"
    ]
  },
  {
    id: "copy",
    title: "写文案（内容表达）",
    description: "描述区、话题与口播句：让人一眼看懂「这条给谁看、看完做什么」。",
    tools: [{ href: ZH.douyinCaption, label: "抖音文案包生成器" }],
    guides: [{ href: ZH.douyinGuideCaptionTemplate, label: "描述区文案模板（含标签）" }],
    reads: [
      { href: ZH.douyinCaptionExamplesSeo, label: "文案范例与描述区公式" },
      { href: ZH.douyinHooksSeo, label: "爆款开头句式（与描述对齐）" }
    ],
    examples: [
      "第一句对齐口播钩子；第二句写清人群；第三句给评论指令。",
      "别复述正片——补那半步：谁适合、不适用、下一步私信/评论关键词。",
      "标签别堆满：3 个精准话题 + 1 个同城/行业词，搜索更友好。"
    ]
  },
  {
    id: "structure",
    title: "内容结构（完播率）",
    description: "分段、气口与整段口播：把信息拆成能拍完的结构，再谈完播。",
    tools: [
      { href: ZH.douyinStructure, label: "抖音内容结构生成器" },
      { href: ZH.douyinScript, label: "抖音口播脚本生成器" }
    ],
    guides: [
      { href: ZH.douyinGuideScriptTemplate, label: "口播脚本骨架（分段 + 气口）" },
      { href: ZH.douyinGuideHookFormula, label: "开头与中段如何衔接" }
    ],
    reads: [{ href: ZH.douyinScriptTemplatesSeo, label: "口播脚本模板与分镜" }],
    examples: [
      "0–2 秒：停滑；2–10 秒：一句话建立信任；10–25 秒：只讲一个方法；最后 5 秒：评论指令。",
      "中段最多三个信息点，每点一句人话，中间留气口给观众反应。",
      "结尾别同时「关注点赞收藏」——只给一个最容易执行的动作。"
    ]
  },
  {
    id: "conversion",
    title: "带货转化（商业变现）",
    description: "评论、私信与描述区引导：把互动接到线索与成交。",
    tools: [
      { href: ZH.douyinCommentCta, label: "抖音评论引导生成器" },
      { href: ZH.douyinCaption, label: "抖音文案包（含引导与话题）" }
    ],
    guides: [
      { href: ZH.douyinGuideCaptionTemplate, label: "描述区转化结构" },
      { href: ZH.douyinGuideGrowthStrategy, label: "从互动到成交的路径" }
    ],
    reads: [{ href: ZH.douyinCaptionExamplesSeo, label: "高互动结尾句式与转化提示" }],
    examples: [
      "评一条你的行业，我回你一条可拍选题——降低评论成本。",
      "二选一：你更卡「开头」还是「结尾」？评出来我下期只讲一个。",
      "私信扣「爆款」领对照表——把冲动留到私信里收口。"
    ]
  },
  {
    id: "account",
    title: "账号运营（长期增长）",
    description: "工作台、复盘节奏与算力：把日更、测试与变现跑成闭环。",
    tools: [{ href: ZH.growthKit, label: "短视频增长指南" }],
    guides: [{ href: ZH.douyinGuideGrowthStrategy, label: "账号增长策略（可执行清单）" }],
    reads: [
      { href: ZH.pricing, label: "定价与算力包" },
      { href: ZH.pro, label: "Pro 价值说明" },
      { href: ZH.douyinTutorials, label: "教程与长尾索引" }
    ],
    examples: [
      "每天只测一个变量：同一天线只改开头或只改结尾，别全改。",
      "把高评论选题存成「可复拍清单」，下周换钩子再拍一版。",
      "复盘看三件事：完播、评论关键词、私信话术——比只看播放量有用。"
    ]
  }
];
