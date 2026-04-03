/**
 * 英文内容语言隔离：禁止 CJK（与生成逻辑分离，仅检测）。
 */

export type EnLanguageGateResult = {
  passed: boolean;
  reason?: string;
};

const HAS_CJK = /[\u4e00-\u9fff]/;

export function evaluateEnContentLanguage(text: string): EnLanguageGateResult {
  if (HAS_CJK.test(text)) {
    return { passed: false, reason: "contains_chinese" };
  }
  return { passed: true };
}
