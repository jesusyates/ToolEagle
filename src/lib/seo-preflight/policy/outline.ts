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
      case "comparison_from_experience":
        return ["对比范围", "方案 A 要点", "方案 B 要点", "适用场景", "决策建议", "总结"];
      case "listicle":
      case "mistakes":
        return ["为什么重要", "要点一", "要点二", "要点三", "落地建议", "总结"];
      case "problem_solution":
        return ["现象与痛点", "根因分析", "解决框架", "执行步骤", "避坑", "下一步验证"];
      case "myth_busting":
        return ["常见误解", "事实与证据", "正确心智模型", "可执行替代方案", "自检清单", "总结"];
      case "pattern_breakdown":
        return ["模式概览", "适用场景", "变体与模板", "适用人群", "风险点", "总结"];
      case "scenario_specific":
        return ["场景设定", "约束条件", "行动清单", "边界情况", "若仍卡住", "复盘"];
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
      case "comparison_from_experience":
        return ["\u6bd4\u8f03\u306e\u524d\u63d0", "選択肢A", "選択肢B", "向いている人", "選び方", "まとめ"];
      case "listicle":
      case "mistakes":
        return ["要点", "ポイント1", "ポイント2", "ポイント3", "実践のコツ", "まとめ"];
      case "problem_solution":
        return ["症状", "原因の整理", "解決の骨格", "手順", "落とし穴", "次の検証"];
      case "myth_busting":
        return ["よくある誤解", "事実関係", "正しい考え方", "代わりの打ち手", "チェック", "まとめ"];
      case "pattern_breakdown":
        return ["パターン概要", "効く場面", "バリエーション", "向き不向き", "注意点", "まとめ"];
      case "scenario_specific":
        return ["シナリオ設定", "制約", "プレイブック", "エッジケース", "詰まったら", "振り返り"];
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
    case "problem_solution":
      return [
        "What's going wrong",
        "Why it happens",
        "Fix framework",
        "Step-by-step",
        "Mistakes to avoid",
        "Next test"
      ];
    case "mistakes":
      return [
        "The costly mistakes",
        "Why they hurt results",
        "Fix #1 — quick win",
        "Fix #2 — consistency",
        "Fix #3 — quality bar",
        "Checklist before you post"
      ];
    case "comparison_from_experience":
      return [
        "What I tested",
        "Setup and method",
        "Results that surprised me",
        "What actually gets clicks",
        "What I'd skip next time",
        "Takeaways you can copy"
      ];
    case "myth_busting":
      return [
        "The common myth",
        "What's actually true",
        "Evidence from the field",
        "Better playbook",
        "Do this instead",
        "Recap"
      ];
    case "pattern_breakdown":
      return [
        "The pattern",
        "When it works",
        "Variations and templates",
        "Who it's for",
        "Pitfalls",
        "Quick recap"
      ];
    case "scenario_specific":
      return [
        "Your scenario",
        "Constraints",
        "Playbook",
        "Edge cases",
        "If it still stalls",
        "Recap"
      ];
    case "guide":
    default:
      return ["Problem framing", "Principles", "Playbook steps", "Real-world cues", "Pitfalls", "What to do next"];
  }
}
