import type { SeoPreflightContentType } from "../types/preflight";

/** Deterministic cheap outline — no model calls; language via templates (UI may be Chinese; outline follows contentLanguage). */
export function buildCheapOutlineHeadings(
  title: string,
  contentType: SeoPreflightContentType,
  contentLanguage: string
): string[] {
  const lang = (contentLanguage || "en").toLowerCase();
  const t = title.slice(0, 80);

  if (lang.startsWith("zh")) {
    switch (contentType) {
      case "how_to":
        return ["背景与目标", "准备工作", "分步操作", "常见错误", "检查清单", "延伸阅读"];
      case "comparison":
        return ["对比范围", "方案 A 要点", "方案 B 要点", "适用场景", "决策建议", "总结"];
      case "listicle":
        return ["为什么重要", "要点一", "要点二", "要点三", "落地建议", "总结"];
      case "guide":
      default:
        return ["问题定义", "核心原则", "实战步骤", "案例提示", "常见坑", "下一步"];
    }
  }

  if (lang.startsWith("ja")) {
    switch (contentType) {
      case "how_to":
        return ["概要", "準備", "手順", "よくある失敗", "チェックリスト", "まとめ"];
      case "comparison":
        return ["\u6bd4\u8f03\u306e\u524d\u63d0", "選択肢A", "選択肢B", "向いている人", "選び方", "まとめ"];
      case "listicle":
        return ["要点", "ポイント1", "ポイント2", "ポイント3", "実践のコツ", "まとめ"];
      case "guide":
      default:
        return [
          "はじめに",
          "\u57fa\u672c\u65b9\u91dd",
          "実践ステップ",
          "事例のヒント",
          "注意点",
          "\u6b21\u306e\u4e00\u624b"
        ];
    }
  }

  switch (contentType) {
    case "how_to":
      return [
        "What you'll achieve",
        "Prerequisites",
        "Step-by-step",
        "Common mistakes",
        "Quality checklist",
        `Next steps for ${t}`
      ];
    case "comparison":
      return [
        "Scope of comparison",
        "Option A — strengths",
        "Option B — strengths",
        "When to pick which",
        "Decision framework",
        "Summary"
      ];
    case "listicle":
      return ["Why this matters", "Key idea #1", "Key idea #2", "Key idea #3", "How to apply", "Recap"];
    case "guide":
    default:
      return ["Problem framing", "Principles", "Playbook steps", "Real-world cues", "Pitfalls", "What to do next"];
  }
}
