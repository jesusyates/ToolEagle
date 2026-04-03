/**
 * V300 中文 guide 生成骨架（与英文 rebuild-article 目录隔离）。
 * 输出：Answer 摘要、正文、FAQ — 全中文表述。
 *
 * 语言约束（生成层契约，供上游/编排引用）：
 * - 禁止输出任何英文句子或连续英文字符（展示与检索以中文为主）。
 * - 禁止出现 TikTok、Instagram、YouTube、Facebook、Twitter、LinkedIn、Meta、Reels、Shorts 等平台英文专名；
 *   请用「短视频平台」「海外短视频」「图文社区」等中文表述替代。
 * - 若合并后的标题/正文/摘要/问答/标签中，出现连续拉丁字母超过 6 个（即 ≥7），或命中上述英文平台词，则判为 languagePurity 不通过。
 */

export type ZhFaqItem = { question: string; answer: string };

export type ZhRebuildArticleInput = {
  title: string;
  context?: string;
  platform: "douyin" | "xiaohongshu";
  contentType?: "guide" | "ideas";
};

export type ZhLanguagePurity = { pass: boolean; reason?: string };

export type ZhRebuildArticleResult = {
  title: string;
  body: string;
  aiSummary: string;
  faqs: ZhFaqItem[];
  hashtags: string[];
  languagePurity: ZhLanguagePurity;
};

/** 连续拉丁字母 >6（≥7）即不通过 */
const CONSECUTIVE_LATIN_OVER_6 = /[A-Za-z]{7,}/;

const FORBIDDEN_EN_PLATFORM = /\b(tiktok|instagram|youtube|facebook|twitter|linkedin|meta|reels|shorts|snapchat|pinterest)\b/i;

export function evaluateZhRebuildLanguagePurity(result: Omit<ZhRebuildArticleResult, "languagePurity">): ZhLanguagePurity {
  const blob = [
    result.title,
    result.body,
    result.aiSummary,
    ...result.faqs.flatMap((f) => [f.question, f.answer]),
    ...result.hashtags
  ].join("\n");
  if (CONSECUTIVE_LATIN_OVER_6.test(blob)) {
    return { pass: false, reason: "consecutive_latin_over_6" };
  }
  if (FORBIDDEN_EN_PLATFORM.test(blob)) {
    return { pass: false, reason: "forbidden_english_platform_token" };
  }
  return { pass: true };
}

function buildZhBody(title: string, platform: string, contentType: "guide" | "ideas"): string {
  const pf = platform === "douyin" ? "抖音" : "小红书";
  if (contentType === "ideas") {
    return `## 简介\n\n围绕「${title}」，下面给出可直接落地的若干角度，可按周轮换测试。\n\n## 角度清单\n\n1. **痛点开场**：先说出观众最卡的一步，再给一条可执行动作。\n2. **对比结构**：用「以前/现在」或「错误/正确」强化记忆点。\n3. **系列连载**：同一主题拆成 3 条短内容，形成追更。\n\n## 收尾建议\n\n先固定发布节奏，再微调文案；数据稳定后再做小幅对比测试。`;
  }
  return [
    "## 引言",
    "",
    `本文围绕「${title}」在${pf}上的落地做法展开：先把目标人群与单条内容要解决的问题写清楚，再按步骤执行，最后用数据做小步迭代。这样更容易通过平台的内容质量与互动信号检测，也便于你复盘。`,
    "",
    "## 第一步：明确场景与受众",
    "",
    `先写下本条内容面向谁（例如同城到店、副业起步、学生兼职等），以及观众此刻最想解决的一个具体问题。只选一个主场景，避免一条视频里同时讲「涨粉、带货、私域」多个目标，否则完播与互动会分散。`,
    "",
    "## 第二步：结构与信息密度",
    "",
    `开头三秒内给出结论或强悬念；中间用「问题—做法—示例」三段式展开；结尾给一个可执行的下一步（评论关键词、收藏合集、私信关键词等）。单条只讲清一件事，信息密度适中，比堆砌术语更有效。`,
    "",
    "## 第三步：发布节奏与复盘",
    "",
    `先固定每周发布次数与固定栏目，再微调标题与封面。每次发布后记录播放、完播、互动三项里变化最大的一项，只改一个变量，避免复盘时无法归因。`,
    "",
    "## 常见错误",
    "",
    "- 一条里塞太多知识点，观众不知道要做什么。",
    "- 只追热点、不贴合账号长期定位，导致标签混乱。",
    "- 没有固定更新节奏，数据波动大时无法判断改动是否有效。",
    "",
    "## 实操建议",
    "",
    `把本周要测的变量写进表格（标题角度、封面风格、开头话术等），同一周期内只改一项；数据稳定后再做下一项。若同时做直播与短视频，建议分开记录，避免互相干扰。`,
    "",
    "## 结论",
    "",
    `按「单场景—单问题—单条讲清」执行一到两周，再结合${pf}后台数据做小幅调整，比一次性大改更安全。持续输出比偶尔爆款更能形成稳定推荐。`,
    "",
    "## 补充说明",
    "",
    "若你同时测试多个变量，请把变量与日期记在表格里，避免复盘时无法判断是哪一项带来变化；数据稳定后再做小幅调整更安全。"
  ].join("\n");
}

export function rebuildToZhGuideArticle(input: ZhRebuildArticleInput): ZhRebuildArticleResult {
  const title = input.title.trim();
  const mode = input.contentType ?? "guide";
  const aiSummary = `关于「${title.slice(0, 40)}」：在${input.platform === "douyin" ? "抖音" : "小红书"}上，建议先明确单条目标与受众，再用清晰结构提升完播与互动，避免一次讲太多。`.slice(
    0,
    200
  );
  const faqs: ZhFaqItem[] = [
    { question: "完全新手从哪一步开始？", answer: "先固定发布频率与单条主题，再优化开头三秒与结尾引导。" },
    { question: "最常见的错误是什么？", answer: "一条内容里塞太多信息，观众不知道要做什么。" },
    { question: "多久能看到效果？", answer: "通常需要至少一到两周的稳定输出，再结合数据做小步调整。" }
  ];
  const hashtags =
    input.platform === "douyin" ? ["#抖音运营", "#短视频", "#创作者"] : ["#小红书", "#笔记运营", "#创作者"];
  const base: Omit<ZhRebuildArticleResult, "languagePurity"> = {
    title,
    body: buildZhBody(title, input.platform, mode),
    aiSummary,
    faqs,
    hashtags
  };
  const languagePurity = evaluateZhRebuildLanguagePurity(base);
  return { ...base, languagePurity };
}
