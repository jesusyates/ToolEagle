import type { SeoPreflightContentType } from "../types/preflight";

function zhTypeHintFragment(contentType: SeoPreflightContentType): string {
  switch (contentType) {
    case "how_to":
      return "分步做法与检查清单";
    case "comparison":
    case "comparison_from_experience":
      return "对比要点与选型建议";
    case "listicle":
    case "mistakes":
      return "五个高信号要点与落地建议";
    case "problem_solution":
      return "痛点拆解、原因与可执行修复路径";
    case "myth_busting":
      return "澄清误解、证据与更可执行的替代方案";
    case "pattern_breakdown":
      return "可复用结构、适用场景与变体";
    case "scenario_specific":
      return "具体场景下的约束与行动清单";
    case "guide":
    default:
      return "结构化的步骤、案例提示与常见坑";
  }
}

function jaTypeHintFragment(contentType: SeoPreflightContentType): string {
  switch (contentType) {
    case "how_to":
      return "手順・チェックポイント・よくある失敗";
    case "comparison":
    case "comparison_from_experience":
      return "比較の観点と選び方の指針";
    case "listicle":
    case "mistakes":
      return "実践で効く5つの要点と落とし穴回避";
    case "problem_solution":
      return "症状の切り分け、原因、再現しやすい対処";
    case "myth_busting":
      return "誤解の整理、裏付け、より実行しやすい代替案";
    case "pattern_breakdown":
      return "再利用できる型・適用条件・安全なバリエーション";
    case "scenario_specific":
      return "具体シナリオの制約と実行チェックリスト";
    case "guide":
    default:
      return "手順・実例のヒント・避けるべき落とし穴";
  }
}

function enTypeHintFragment(contentType: SeoPreflightContentType): string {
  switch (contentType) {
    case "how_to":
      return "step-by-step flow, checkpoints, and common mistakes";
    case "comparison":
    case "comparison_from_experience":
      return "tradeoffs, decision criteria, and what to pick";
    case "listicle":
    case "mistakes":
      return "five high-signal ideas with examples you can ship";
    case "problem_solution":
      return "symptom-to-fix framing, diagnostics, and a repeatable remedy";
    case "myth_busting":
      return "bad advice called out, what works instead, and proof-style takeaways";
    case "pattern_breakdown":
      return "repeatable structures, when they work, and safer variations";
    case "scenario_specific":
      return "real constraints, a tight playbook, and edge-case handling";
    case "guide":
    default:
      return "practical steps, real-world cues, and pitfalls to skip";
  }
}

const DESC_TARGET_MIN = 120;
const DESC_TARGET_MAX = 160;

/** Ends with valid sentence closer (no orphaned half-words). */
export function endsWithCompleteSentence(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  const last = t[t.length - 1]!;
  return last === "." || last === "。" || last === "！" || last === "!" || last === "？" || last === "?";
}

function fitDescriptionLength(s: string, min: number, max: number): string {
  let t = s.replace(/\s+/g, " ").trim();
  if (t.length >= min && t.length <= max) return t;

  if (t.length > max) {
    let cut = t.slice(0, max);
    const lastPeriod = cut.lastIndexOf(".");
    const lastCn = cut.lastIndexOf("。");
    const lastStop = Math.max(lastPeriod, lastCn);
    if (lastStop >= min - 1) return cut.slice(0, lastStop + 1).trim();

    const lastSp = cut.lastIndexOf(" ");
    if (lastSp >= min) {
      const chunk = cut.slice(0, lastSp).trim();
      if (!endsWithCompleteSentence(chunk)) return `${chunk}.`;
      return chunk;
    }
    return cut.trim().endsWith(".") ? cut.trim() : `${cut.trim()}.`;
  }

  const pad =
    " Includes clear structure, examples, and pitfalls to avoid.";
  while (t.length < min && t.length < max) {
    const next = (t + pad).trim();
    if (next.length > max) break;
    t = next;
  }
  if (t.length < min) {
    t = `${t} Actionable and up to date.`.trim();
  }
  if (t.length > max) return fitDescriptionLength(t, min, max);
  if (!endsWithCompleteSentence(t)) return `${t}.`;
  return t;
}

/** No LLM: full sentences,120–160 chars target; keyword = topic seed (avoids truncating titles mid-word). */
export function buildMetaDescription(
  topicSeed: string,
  title: string,
  contentLanguage: string,
  contentType: SeoPreflightContentType
): string {
  const lang = (contentLanguage || "en").toLowerCase();
  const keyword = topicSeed.replace(/\s+/g, " ").trim() || title.split(/[.:]/)[0]?.trim() || "this topic";

  if (lang.startsWith("zh")) {
    const typeHint = zhTypeHintFragment(contentType);
    const raw = `本指南围绕「${keyword}」展开，涵盖${typeHint}，适合创作者直接套用与复盘。内容聚焦可执行性，避免空泛理论。`;
    return fitDescriptionLength(raw, DESC_TARGET_MIN, DESC_TARGET_MAX);
  }

  if (lang.startsWith("ja")) {
    const typeHint = jaTypeHintFragment(contentType);
    const raw = `本稿は「${keyword}」に焦点を当て、${typeHint}を整理したガイドです。クリエイターがそのまま試せる構成にしています。`;
    return fitDescriptionLength(raw, DESC_TARGET_MIN, DESC_TARGET_MAX);
  }

  const typeHint = enTypeHintFragment(contentType);

  const raw = `This guide covers ${keyword} for creators: ${typeHint}. It is structured for clarity and updated for 2026. No filler—just actionable guidance you can use.`;
  return fitDescriptionLength(raw, DESC_TARGET_MIN, DESC_TARGET_MAX);
}

export const META_DESCRIPTION_BOUNDS = { min: DESC_TARGET_MIN, max: DESC_TARGET_MAX };
