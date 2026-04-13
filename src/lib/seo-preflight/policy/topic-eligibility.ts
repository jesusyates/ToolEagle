import { evaluateTopicReadiness, topicMaxJaccardAgainstCorpus } from "@/lib/seo/topic-gate";
import type { SeoPreflightContentType } from "../types/preflight";

export type EligibilityResult = { ok: boolean; rejectReason: string | null };

const SIM_DUP = 0.93;

function isCjkLanguage(contentLanguage: string): boolean {
  const l = (contentLanguage || "").toLowerCase();
  return l.startsWith("zh") || l.startsWith("ja") || l.startsWith("jp");
}

/** Language-agnostic listicle / ideas guard (no EN-only regex fork for “primary” path). */
function blockedListicleShape(topic: string): boolean {
  const low = topic.toLowerCase();
  if (/\b(listicle|post ideas|content ideas|caption ideas|hook ideas)\b/i.test(low)) return true;
  if (/\b\d+\s+(ways|tips|ideas|hooks)\b/i.test(low)) return true;
  return false;
}

/** Seed line from registry / file — not yet expanded to a full SEO title (EN seeds may lack intent keywords). */
export function evaluateSeoPreflightTopicSeed(
  topic: string,
  contentLanguage: string,
  contentType: SeoPreflightContentType
): EligibilityResult {
  const trimmed = topic.replace(/\s+/g, " ").trim();
  if (!trimmed) return { ok: false, rejectReason: "empty_topic" };
  if (contentType === "listicle" && blockedListicleShape(trimmed)) {
    return { ok: false, rejectReason: "policy:listicle_shape_blocked" };
  }
  if (isCjkLanguage(contentLanguage)) {
    if (trimmed.length < 8 || trimmed.length > 80) {
      return { ok: false, rejectReason: "length_out_of_range_cjk" };
    }
  }
  return { ok: true, rejectReason: null };
}

/**
 * Full check on the **proposed title** (post-template). Reuses `topic-gate` for Latin/EN; CJK uses Jaccard vs corpus.
 */
export function evaluateTopicEligibility(
  topic: string,
  existingTitles: string[],
  contentLanguage: string,
  contentType: SeoPreflightContentType
): EligibilityResult {
  const trimmed = topic.replace(/\s+/g, " ").trim();
  if (!trimmed) return { ok: false, rejectReason: "empty_topic" };

  if (contentType === "listicle" && blockedListicleShape(trimmed)) {
    return { ok: false, rejectReason: "policy:listicle_shape_blocked" };
  }

  if (isCjkLanguage(contentLanguage)) {
    if (trimmed.length < 8 || trimmed.length > 80) {
      return { ok: false, rejectReason: "length_out_of_range_cjk" };
    }
    const maxJ = topicMaxJaccardAgainstCorpus(trimmed, existingTitles);
    if (maxJ >= SIM_DUP) {
      return { ok: false, rejectReason: `dedupe_high_similarity:${maxJ.toFixed(3)}` };
    }
    return { ok: true, rejectReason: null };
  }

  const readiness = evaluateTopicReadiness({ topic: trimmed, existingTitles });
  if (readiness.decision === "reject") {
    return { ok: false, rejectReason: readiness.reasons.join(",") || "topic_gate_reject" };
  }
  return { ok: true, rejectReason: null };
}
