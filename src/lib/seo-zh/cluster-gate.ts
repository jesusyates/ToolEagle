/**
 * V300 中文 cluster 门禁（骨架）— 独立规则，不沿用英文 jaccard 实现。
 */

export type ZhClusterGateResult = {
  decision: "pass" | "reject" | "rewrite";
  score: number;
  reasons: string[];
};

/** 最小版：长度与基本中文检测 */
export function evaluateZhClusterReadiness(input: { cluster: string }): ZhClusterGateResult {
  const s = input.cluster.replace(/\s+/g, "").trim();
  if (s.length < 6) {
    return { decision: "reject", score: 0, reasons: ["主题过短"] };
  }
  if (/[a-z]{4,}/i.test(input.cluster) && !/抖音|小红书|视频|笔记|账号/.test(input.cluster)) {
    return { decision: "rewrite", score: 40, reasons: ["疑似英文主导表述"] };
  }
  return { decision: "pass", score: 70, reasons: [] };
}
