/**
 * 中文内容语言隔离：禁止英文平台词与连续拉丁字母片段（与生成逻辑分离，仅检测正文/摘要/话题串）。
 */

export type ZhLanguageGateResult = {
  passed: boolean;
  reason?: string;
};

/** 连续 3+ 拉丁字母视为含英文（常见英文词、缩写）。 */
const HAS_LATIN_RUN = /[A-Za-z]{3,}/;

/** 英文平台/产品词（须用中文站常用表述，不混用英文品牌拼写）。 */
const EN_PLATFORM = /\b(tiktok|instagram|youtube|facebook|twitter|linkedin|meta|reels|shorts|snapchat|pinterest)\b/i;

export function evaluateZhContentLanguage(text: string): ZhLanguageGateResult {
  if (EN_PLATFORM.test(text)) {
    return { passed: false, reason: "english_platform_word" };
  }
  if (HAS_LATIN_RUN.test(text)) {
    return { passed: false, reason: "contains_english" };
  }
  return { passed: true };
}
