/**
 * V95: Structured "post package" output for creator tools — publish-ready blocks.
 */

export type CreatorPostPackage = {
  /** V106.1 — 选题 / 一句话主题（与正文同一套） */
  topic: string;
  hook: string;
  /** Short script or bullet talking points (newline-separated ok) */
  script_talking_points: string;
  caption: string;
  cta_line: string;
  hashtags: string;
  why_it_works: string;
  posting_tips: string;
  /** Best use scenario — helps "next step" UX */
  best_for?: string;
  /** V106 — Variation pack label (rotate across packages) */
  variation_pack?: string;
  /** V106 — 强钩子 | 中等钩子 | 保守钩子 (or EN equivalents from model) */
  hook_strength_label?: string;
  /** V106 — three explicit “why” dimensions */
  why_opening_grabs?: string;
  why_structure_completion?: string;
  why_copy_growth?: string;
  /** V106 — real use context */
  context_account?: string;
  context_scenario?: string;
  context_audience?: string;
  /** V106 — publish-ready: segments + rhythm / pacing cues */
  publish_rhythm?: string;
  /** V106 — comparison mode */
  version_plain?: string;
  version_optimized?: string;
};

/** Core blocks used for validation + primary render loop */
export const POST_PACKAGE_KEYS: (keyof CreatorPostPackage)[] = [
  "topic",
  "hook",
  "script_talking_points",
  "caption",
  "cta_line",
  "hashtags",
  "why_it_works",
  "posting_tips"
];

/** V106 — shown after core loop (labels in packageLabels / EN labels) */
export const V106_PACKAGE_KEYS: (keyof CreatorPostPackage)[] = [
  "why_opening_grabs",
  "why_structure_completion",
  "why_copy_growth",
  "context_account",
  "context_scenario",
  "context_audience",
  "publish_rhythm"
];

export function emptyPackage(partial?: Partial<CreatorPostPackage>): CreatorPostPackage {
  return {
    topic: partial?.topic ?? "",
    hook: partial?.hook ?? "",
    script_talking_points: partial?.script_talking_points ?? "",
    caption: partial?.caption ?? "",
    cta_line: partial?.cta_line ?? "",
    hashtags: partial?.hashtags ?? "",
    why_it_works: partial?.why_it_works ?? "",
    posting_tips: partial?.posting_tips ?? "",
    best_for: partial?.best_for,
    variation_pack: partial?.variation_pack,
    hook_strength_label: partial?.hook_strength_label,
    why_opening_grabs: partial?.why_opening_grabs,
    why_structure_completion: partial?.why_structure_completion,
    why_copy_growth: partial?.why_copy_growth,
    context_account: partial?.context_account,
    context_scenario: partial?.context_scenario,
    context_audience: partial?.context_audience,
    publish_rhythm: partial?.publish_rhythm,
    version_plain: partial?.version_plain,
    version_optimized: partial?.version_optimized
  };
}

/** Human-readable labels for UI */
export const PACKAGE_SECTION_LABELS: Record<keyof CreatorPostPackage, string> = {
  topic: "Topic / title",
  hook: "Hook",
  script_talking_points: "Short script / talking points",
  caption: "Caption",
  cta_line: "CTA line",
  hashtags: "Hashtags",
  why_it_works: "Summary (one line)",
  posting_tips: "Posting tips / best use",
  best_for: "Best for this scenario",
  variation_pack: "Variation pack",
  hook_strength_label: "Hook strength",
  why_opening_grabs: "Why this opening grabs attention",
  why_structure_completion: "Why this structure lifts completion rate",
  why_copy_growth: "Why this copy fits selling / growth",
  context_account: "Account types this fits",
  context_scenario: "Content scenarios",
  context_audience: "Audience fit",
  publish_rhythm: "Publish-ready segments & rhythm",
  version_plain: "Plain version",
  version_optimized: "Optimized version"
};

export function packageBlockCount(p: CreatorPostPackage): number {
  return POST_PACKAGE_KEYS.filter((k) => (p[k] ?? "").toString().trim().length > 0).length;
}

export function formatPackageAsPlainText(
  p: CreatorPostPackage,
  labels: Partial<Record<keyof CreatorPostPackage, string>> = PACKAGE_SECTION_LABELS
): string {
  const lines: string[] = [];
  const L = (k: keyof CreatorPostPackage) => (labels[k] ?? PACKAGE_SECTION_LABELS[k] ?? String(k)) as string;

  for (const key of ["variation_pack", "hook_strength_label"] as const) {
    const v = (p[key] ?? "").toString().trim();
    if (!v) continue;
    lines.push(`${L(key)}:\n${v}`);
  }
  for (const key of ["version_plain", "version_optimized"] as const) {
    const v = (p[key] ?? "").toString().trim();
    if (!v) continue;
    lines.push(`${L(key)}:\n${v}`);
  }
  for (const key of POST_PACKAGE_KEYS) {
    const v = (p[key] ?? "").toString().trim();
    if (!v) continue;
    lines.push(`${L(key)}:\n${v}`);
  }
  for (const key of V106_PACKAGE_KEYS) {
    const v = (p[key] ?? "").toString().trim();
    if (!v) continue;
    lines.push(`${L(key)}:\n${v}`);
  }
  if (p.best_for?.trim()) {
    lines.push(`${L("best_for")}:\n${p.best_for}`);
  }
  return lines.join("\n\n");
}

/** Parse OpenAI JSON { packages: [...] } */
export function parsePackagesJson(raw: string): CreatorPostPackage[] {
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  if (!text) return [];
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        data = JSON.parse(text.slice(start, end + 1));
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }
  if (!data) return [];

  let pkgs: unknown = null;
  if (Array.isArray(data)) {
    pkgs = data;
  } else if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    pkgs =
      obj.packages ??
      obj.results ??
      obj.items ??
      (obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>).packages : null);
  }
  if (!Array.isArray(pkgs)) return [];

  const out: CreatorPostPackage[] = [];
  for (const item of pkgs) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    out.push(
      emptyPackage({
        topic: String(o.topic ?? o.content_topic ?? ""),
        hook: String(o.hook ?? o.Hook ?? ""),
        script_talking_points: String(
          o.script_talking_points ?? o.script ?? o.talking_points ?? ""
        ),
        caption: String(o.caption ?? ""),
        cta_line: String(o.cta_line ?? o.cta ?? ""),
        hashtags: String(o.hashtags ?? ""),
        why_it_works: String(o.why_it_works ?? o.why ?? ""),
        posting_tips: String(o.posting_tips ?? o.tips ?? ""),
        best_for: o.best_for != null ? String(o.best_for) : undefined,
        variation_pack: o.variation_pack != null ? String(o.variation_pack) : undefined,
        hook_strength_label: o.hook_strength_label != null ? String(o.hook_strength_label) : undefined,
        why_opening_grabs: o.why_opening_grabs != null ? String(o.why_opening_grabs) : undefined,
        why_structure_completion: o.why_structure_completion != null ? String(o.why_structure_completion) : undefined,
        why_copy_growth: o.why_copy_growth != null ? String(o.why_copy_growth) : undefined,
        context_account: o.context_account != null ? String(o.context_account) : undefined,
        context_scenario: o.context_scenario != null ? String(o.context_scenario) : undefined,
        context_audience: o.context_audience != null ? String(o.context_audience) : undefined,
        publish_rhythm: o.publish_rhythm != null ? String(o.publish_rhythm) : undefined,
        version_plain: o.version_plain != null ? String(o.version_plain) : undefined,
        version_optimized: o.version_optimized != null ? String(o.version_optimized) : undefined
      })
    );
  }
  return out.filter((p) => packageBlockCount(p) >= 5);
}

export type PostPackageToolKind =
  | "tiktok_caption"
  | "hook_focus"
  | "ai_caption"
  /** V105.1 — Douyin growth tools (same JSON schema, semantic mapping in prompts) */
  | "douyin_topic"
  | "douyin_comment_cta"
  | "douyin_structure";
