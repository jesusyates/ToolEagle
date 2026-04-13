import type { SeoPreflightContentType } from "../types/preflight";

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
    const typeHint =
      contentType === "how_to"
        ? "分步做法与检查清单"
        : contentType === "comparison"
          ? "对比要点与选型建议"
          : contentType === "listicle"
            ? "五个高信号要点与落地建议"
            : "结构化的步骤、案例提示与常见坑";
    const raw = `本指南围绕「${keyword}」展开，涵盖${typeHint}，适合创作者直接套用与复盘。内容聚焦可执行性，避免空泛理论。`;
    return fitDescriptionLength(raw, DESC_TARGET_MIN, DESC_TARGET_MAX);
  }

  if (lang.startsWith("ja")) {
    const raw = `本稿は「${keyword}」に焦点を当て、手順・落とし穴・実践のコツを整理したガイドです。クリエイターがそのまま試せる構成にしています。`;
    return fitDescriptionLength(raw, DESC_TARGET_MIN, DESC_TARGET_MAX);
  }

  const typeHint =
    contentType === "how_to"
      ? "step-by-step flow, checkpoints, and common mistakes"
      : contentType === "comparison"
        ? "tradeoffs, decision criteria, and what to pick"
        : contentType === "listicle"
          ? "five high-signal ideas with examples you can ship"
          : "practical steps, real-world cues, and pitfalls to skip";

  const raw = `This guide covers ${keyword} for creators: ${typeHint}. It is structured for clarity and updated for 2026. No filler—just actionable guidance you can use.`;
  return fitDescriptionLength(raw, DESC_TARGET_MIN, DESC_TARGET_MAX);
}

export const META_DESCRIPTION_BOUNDS = { min: DESC_TARGET_MIN, max: DESC_TARGET_MAX };
