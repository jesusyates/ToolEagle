/**
 * V104 — Post-output soft filtering (replace / normalize). Does not block generations.
 */

import type { CreatorPostPackage } from "@/lib/ai/postPackage";
import { rulesForMarket, type MergedRules } from "./platform-rules";

export type SensitiveHit = { kind: "banned_word" | "risky_pattern"; value: string };

/**
 * Find banned substrings (case-insensitive) and risky pattern codes present in text.
 */
export function detectSensitiveWords(text: string, rules: MergedRules): SensitiveHit[] {
  const hits: SensitiveHit[] = [];
  const lower = text.toLowerCase();
  for (const w of rules.bannedWords) {
    if (!w.trim()) continue;
    if (lower.includes(w.toLowerCase())) {
      hits.push({ kind: "banned_word", value: w });
    }
  }
  for (const { pattern, code } of rules.riskyPatterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    if (re.test(text)) {
      hits.push({ kind: "risky_pattern", value: code });
    }
  }
  return hits;
}

/**
 * Apply ordered rewrite rules once per rule (left-to-right).
 */
export function replaceRiskPhrases(text: string, rules: MergedRules): { text: string; replacementCount: number } {
  let out = text;
  let replacementCount = 0;
  for (const { pattern, replacement } of rules.rewriteRules) {
    const flags = pattern.global ? pattern.flags : `${pattern.flags}g`;
    const re = new RegExp(pattern.source, flags);
    out = out.replace(re, () => {
      replacementCount++;
      return replacement;
    });
  }
  return { text: out, replacementCount };
}

/** Trim, collapse excessive spaces/newlines; does not remove meaning */
export function normalizeSafeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export type PackageSafetyResult = {
  packages: CreatorPostPackage[];
  /** Number of field-level rewrite applications (approximate) */
  filteredCount: number;
  /** Distinct risk signals detected before/after filter (pattern codes + banned words) */
  riskDetected: number;
  profile: "cn_merged" | "global_merged";
};

const PACKAGE_STRING_KEYS: (keyof CreatorPostPackage)[] = [
  "topic",
  "hook",
  "script_talking_points",
  "caption",
  "cta_line",
  "hashtags",
  "why_it_works",
  "posting_tips",
  "best_for",
  "variation_pack",
  "hook_strength_label",
  "why_opening_grabs",
  "why_structure_completion",
  "why_copy_growth",
  "context_account",
  "context_scenario",
  "context_audience",
  "publish_rhythm",
  "version_plain",
  "version_optimized"
];

/**
 * Run detect → replace → normalize on every string field of every package.
 */
export type PlainTextSafetyResult = {
  text: string;
  filteredCount: number;
  riskDetected: number;
  profile: "cn_merged" | "global_merged";
};

/**
 * Provider-agnostic post-output pass for any plain string (any model / any route).
 */
export function applyContentSafetyToPlainText(text: string, market: "cn" | "global"): PlainTextSafetyResult {
  const { profile, rules } = rulesForMarket(market);
  const riskSet = new Set<string>();
  if (text.trim()) {
    for (const h of detectSensitiveWords(text, rules)) {
      riskSet.add(`${h.kind}:${h.value}`);
    }
  }
  const { text: replaced, replacementCount } = replaceRiskPhrases(text, rules);
  const normalized = normalizeSafeText(replaced);
  return {
    text: normalized,
    filteredCount: replacementCount,
    riskDetected: riskSet.size,
    profile
  };
}

export type StringArraySafetyResult = {
  parts: string[];
  filteredCount: number;
  riskDetected: number;
  profile: "cn_merged" | "global_merged";
};

/** e.g. /api/generate result list — same rules as packages, any provider */
export function applyContentSafetyToStringArray(parts: string[], market: "cn" | "global"): StringArraySafetyResult {
  const { profile, rules } = rulesForMarket(market);
  const riskSet = new Set<string>();
  let filteredCount = 0;
  const out = parts.map((raw) => {
    if (!raw.trim()) return raw;
    for (const h of detectSensitiveWords(raw, rules)) {
      riskSet.add(`${h.kind}:${h.value}`);
    }
    const { text: replaced, replacementCount } = replaceRiskPhrases(raw, rules);
    filteredCount += replacementCount;
    return normalizeSafeText(replaced);
  });
  return { parts: out, filteredCount, riskDetected: riskSet.size, profile };
}

export function applyContentSafetyToPackages(
  packages: CreatorPostPackage[],
  market: "cn" | "global"
): PackageSafetyResult {
  const { profile, rules } = rulesForMarket(market);
  const riskSet = new Set<string>();
  let filteredCount = 0;

  const outPkgs = packages.map((pkg) => {
    const next: CreatorPostPackage = { ...pkg };
    for (const key of PACKAGE_STRING_KEYS) {
      const raw = (next[key] ?? "").toString();
      if (!raw.trim()) continue;
      for (const h of detectSensitiveWords(raw, rules)) {
        riskSet.add(`${h.kind}:${h.value}`);
      }
      const { text: replaced, replacementCount } = replaceRiskPhrases(raw, rules);
      filteredCount += replacementCount;
      const normalized = normalizeSafeText(replaced);
      (next as Record<string, unknown>)[key] = normalized;
    }
    return next;
  });

  return {
    packages: outPkgs,
    filteredCount,
    riskDetected: riskSet.size,
    profile
  };
}
