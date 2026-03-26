/**
 * CI checks for **local template generators** (`audit:tools`).
 *
 * These are **engineering guardrails** (relevance, variation, content safety)—not a proxy for
 * “user delight”. Real usability comes from UX, copy, mobile flows, latency, and manual review.
 */
import { applyContentSafetyToStringArray } from "@/lib/content-safety/filter";
import { detectSensitiveWords } from "@/lib/content-safety/filter";
import { rulesForMarket } from "@/lib/content-safety/platform-rules";
import type { GeneratorConfig } from "@/config/generators";

export type ToolGenerateConfig = Pick<GeneratorConfig, "generate">;

export type ToolQualityViolation = {
  slug: string;
  type: "non_random" | "low_input_relevance" | "safety_risk";
  detail: string;
};

export const AUDIT_SAMPLE_INPUTS = [
  "productivity workflow for creators",
  "fitness tips for beginners"
] as const;

export const RISKY_INPUTS: Record<"global" | "cn", string> = {
  global: "guaranteed results hack the algorithm buy followers whatsapp me",
  cn: "百分百 包过 必火 稳赚 躺赚 加微信 绕过审核 刷量"
};

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractKeywords(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
}

export function hasInputSignal(output: string, input: string): boolean {
  const out = normalizeText(output);
  const keys = extractKeywords(input);
  if (keys.length === 0) return true;
  return keys.some((k) => out.includes(k));
}

export function inferMarketBySlug(slug: string): "cn" | "global" {
  if (slug.startsWith("douyin-")) return "cn";
  return "global";
}

/** Run the same checks the Jest audit uses—returns issues to fix, not a “score”. */
export function auditToolGenerator(slug: string, cfg: ToolGenerateConfig): ToolQualityViolation[] {
  const violations: ToolQualityViolation[] = [];
  const auditInputs = [...AUDIT_SAMPLE_INPUTS];

  const input = auditInputs[0];
  const run1 = cfg.generate(input);
  const run2 = cfg.generate(input);
  const run3 = cfg.generate(input);
  const sig1 = JSON.stringify(run1);
  const sig2 = JSON.stringify(run2);
  const sig3 = JSON.stringify(run3);
  if (sig1 === sig2 && sig2 === sig3) {
    violations.push({
      slug,
      type: "non_random",
      detail: "same input produced identical outputs across 3 runs"
    });
  }

  for (const sampleInput of auditInputs) {
    const outs = cfg.generate(sampleInput).map((o) => o.toString());
    const relevantCount = outs.filter((o) => hasInputSignal(o, sampleInput)).length;
    const relevanceRatio = outs.length > 0 ? relevantCount / outs.length : 0;
    if (relevanceRatio < 0.6) {
      violations.push({
        slug,
        type: "low_input_relevance",
        detail: `only ${relevantCount}/${outs.length} outputs clearly match input "${sampleInput}"`
      });
    }
  }

  const market = inferMarketBySlug(slug);
  const { rules } = rulesForMarket(market);
  const safetyInput = auditInputs[1];
  const safetyOuts = cfg.generate(safetyInput).map((o) => o.toString());
  for (const out of safetyOuts) {
    const hits = detectSensitiveWords(out, rules);
    if (hits.length > 0) {
      violations.push({
        slug,
        type: "safety_risk",
        detail: `generated text contains risky terms: ${hits.map((h) => h.value).join(", ")}`
      });
      break;
    }
  }

  const riskyRaw = cfg.generate(RISKY_INPUTS[market]).map((o) => o.toString());
  const rawHits = riskyRaw.reduce((acc, out) => acc + detectSensitiveWords(out, rules).length, 0);
  const filtered = applyContentSafetyToStringArray(riskyRaw, market).parts;
  const filteredHits = filtered.reduce((acc, out) => acc + detectSensitiveWords(out, rules).length, 0);
  if (rawHits > 0 && filteredHits > 0) {
    violations.push({
      slug,
      type: "safety_risk",
      detail: `safety filter ineffective for risky input (${rawHits} -> ${filteredHits})`
    });
  }

  return violations;
}
