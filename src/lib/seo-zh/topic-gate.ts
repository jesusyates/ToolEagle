/**
 * V300 中文 topic 门禁（骨架）— 独立规则。
 */

export type ZhTopicGateResult = {
  decision: "pass" | "reject";
  score: number;
  reasons: string[];
  contentType: "guide" | "ideas";
};

/** 最小版：重复标题检测 + 长度 */
export function evaluateZhTopicReadiness(input: {
  topic: string;
  existingTitles: string[];
}): ZhTopicGateResult {
  const t = input.topic.trim();
  if (t.length < 12) {
    return { decision: "reject", score: 0, reasons: ["问题过短"], contentType: "guide" };
  }
  const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const n = norm(t);
  for (const ex of input.existingTitles) {
    if (norm(ex) === n) {
      return { decision: "reject", score: 10, reasons: ["标题重复"], contentType: "guide" };
    }
  }
  const contentType: "guide" | "ideas" = /几条|多少条|发几|几条合适/.test(t) ? "ideas" : "guide";
  return { decision: "pass", score: 75, reasons: [], contentType };
}
