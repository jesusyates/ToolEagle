/**
 * V97.1 — Pattern library copy for /zh tools (creator-native Chinese, not literal EN translation).
 */

import type { ExampleCategory, StructuredCreatorExample } from "./core-structured-examples";

/** Short CTA pattern hints for ZH tool sidebar */
export const ZH_CTA_PATTERNS: { pattern: string; use_when: string }[] = [
  { pattern: "评论里交出你的××", use_when: "需要评论权重、收集用户画像" },
  { pattern: "关注我，下期拆××", use_when: "做系列内容、拉高关注转化" },
  { pattern: "私信「关键词」领××", use_when: "私域承接、资料引流" },
  { pattern: "你觉得哪种更划算？", use_when: "对比类内容，激发站队讨论" },
  { pattern: "别划走，最后一句最关键", use_when: "拉完播、把高潮留在结尾" },
  { pattern: "同款××我放在橱窗了", use_when: "带货短视频收口" }
];

export const ZH_STRUCTURED_EXAMPLES: Record<ExampleCategory, StructuredCreatorExample[]> = {
  tiktok_caption: [
    {
      niche: "减脂 / 健身",
      goal: "收藏 + 跟练",
      pattern: "反常识 + 结果对比",
      example: "都说先有氧才掉秤，我偏把力量放前面——两周后精神状态像换了个人。",
      why_it_works: "打破刻板印象，给具体时间点，收藏党会觉得「值得一试」。"
    },
    {
      niche: "小店 / 本地商家",
      goal: "评论互动",
      pattern: "POV + 扎心场景",
      example: "POV：你一周拍了十条短视频，开头还是像在念说明书。",
      why_it_works: "点名创作者真实痛点，容易引发「我也是」式评论。"
    },
    {
      niche: "知识 / 自律",
      goal: "转发",
      pattern: "清单体开头",
      example: "我戒掉的 3 个「假努力」习惯——成绩没一夜起飞，但专注回来了。",
      why_it_works: "数字降低阅读成本，谦虚收尾更可信，适合转发到学习群。"
    },
    {
      niche: "美食 / 下厨",
      goal: "完播",
      pattern: "悬念 + 步骤感",
      example: "别划走：这个调料顺序错了，整锅香味少一半。",
      why_it_works: "强挽留 + 具体承诺，适合短视频前几秒拉停留。"
    },
    {
      niche: "职场 / 副业",
      goal: "私信咨询",
      pattern: "身份锚点 + 反套路",
      example: "副业做了半年没起色？你可能输在「同时做三件事」。",
      why_it_works: "指出常见错误结构，吸引想复盘的人私信要方法。"
    },
    {
      niche: "美妆 / 护肤",
      goal: "带货点击",
      pattern: "踩坑复盘",
      example: "跟风买的精华，我坚持用空瓶才敢说：这三类人别入。",
      why_it_works: "建立信任 + 人群筛选，利于后续挂车或引导橱窗。"
    }
  ],
  hook: [
    {
      niche: "口播带货",
      goal: "前 1 秒停滑",
      pattern: "数字冲击",
      example: "3 秒告诉你，为什么你讲产品总像广告。",
      why_it_works: "极短时间承诺 + 痛点，适合信息流抢注意力。"
    },
    {
      niche: "知识博主",
      goal: "提高完播",
      pattern: "认知反差",
      example: "你以为勤奋就能涨粉？算法其实在奖励「重复结构」。",
      why_it_works: "挑战常识，激发「那到底是什么」的好奇心。"
    },
    {
      niche: "剧情 / 搞笑",
      goal: "评论造梗",
      pattern: "第一人称误会",
      example: "当我妈第一次看我剪的短视频……",
      why_it_works: "家庭场景共鸣强，评论区容易衍生段子。"
    },
    {
      niche: "本地探店",
      goal: "到店转化",
      pattern: "本地人视角",
      example: "在这条街住了五年，这家我只带真朋友去。",
      why_it_works: "信任背书 + 私密感，适合同城账号。"
    },
    {
      niche: "成长 / 情绪",
      goal: "收藏保存",
      pattern: "温柔反问",
      example: "如果你也对现状不满意，先别急着换赛道。",
      why_it_works: "降低防御心理，适合长一点的口播开场。"
    },
    {
      niche: "数码 / 测评",
      goal: "粉丝粘性",
      pattern: "站队预告",
      example: "这期说完可能会被喷，但我还是要讲清楚。",
      why_it_works: "制造张力，观众期待观点释放。"
    }
  ],
  ai_caption: [
    {
      niche: "自媒体矩阵",
      goal: "一稿多平台",
      pattern: "结构先行",
      example: "同一主题，抖音要「钩子」，小红书要「清单」，视频号要「信任」——先定结构再写词。",
      why_it_works: "帮创作者从「写一句」升级到「配一套分发逻辑」。"
    },
    {
      niche: "口播脚本",
      goal: "提词效率",
      pattern: "节拍拆分",
      example: "0–3 秒：抛问题；3–10 秒：给反常识；10–20 秒：一个可抄作业的动作。",
      why_it_works: "按时间轴组织信息，拍摄时少 NG。"
    },
    {
      niche: "直播切片",
      goal: "引流直播间",
      pattern: "高光提炼",
      example: "昨晚直播间有人问爆的问题，我 15 秒说清楚。",
      why_it_works: "把直播资产二次包装，缩短转化路径。"
    },
    {
      niche: "品牌故事",
      goal: "信任转化",
      pattern: "细节真实",
      example: "我们不是在卖便宜，是在把中间环节砍掉——这句话背后是一次退货教训。",
      why_it_works: "故事化细节比口号更像真人，利于私域承接。"
    },
    {
      niche: "课程 / 知识付费",
      goal: "私信领资料",
      pattern: "结果前置",
      example: "不用买课也能先做对的第一步：把你的目标拆成「可拍成视频」的三块。",
      why_it_works: "先给轻量价值，再引导深度产品。"
    },
    {
      niche: "职场干货",
      goal: "转发收藏",
      pattern: "框架命名",
      example: "我用「三件事法则」排优先级——今天只分享第一件怎么做。",
      why_it_works: "可记忆的方法名，利于收藏和二次传播。"
    }
  ]
};
