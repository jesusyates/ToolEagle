import { getDeepseekModel } from "@/config/ai-router";
import { deepseekProvider } from "@/lib/ai/providers/deepseek";
import { normalizeTopicKey, type SeoHistoryLedgerItem } from "./seo-history-ledger";

export type { SeoHistoryLedgerItem } from "./seo-history-ledger";
export { normalizeTopicKey };

export type SeoHistoryContext = {
  relatedPublishedTitles: string[];
  relatedScheduledTitles: string[];
  relatedDraftTitles: string[];
  repeatedPatternsToAvoid: string[];
  /** When set, framework/body prompts use full published-memory entries. */
  ledgerItems?: SeoHistoryLedgerItem[];
};

const DEFAULT_HISTORY_PATTERNS = [
  "generic motivational intro",
  "template-heavy paragraph openings",
  "repeating the same advice in multiple sections",
  "weak comparison framing",
  "empty filler conclusions"
];

export function buildSeoHistoryContext(input: {
  title: string;
  corpus?: Array<{ title?: string; status?: string }>;
  /** When non-empty, preferred over scanning `corpus` for published memory. */
  ledgerItems?: SeoHistoryLedgerItem[];
}): SeoHistoryContext {
  const basePatterns = [...DEFAULT_HISTORY_PATTERNS];

  if (input.ledgerItems && input.ledgerItems.length > 0) {
    const items = input.ledgerItems.slice(0, 10);
    for (const it of items) {
      for (const h of it.duplicateRiskHints || []) {
        if (h.trim()) basePatterns.push(h.trim());
      }
    }
    const seen = new Set<string>();
    const repeatedPatternsToAvoid = basePatterns.filter((p) => {
      const k = p.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return {
      relatedPublishedTitles: items.map((i) => i.title).slice(0, 8),
      relatedScheduledTitles: [],
      relatedDraftTitles: [],
      repeatedPatternsToAvoid,
      ledgerItems: items
    };
  }

  const allTitles = (input.corpus || [])
    .map((x) => (x.title || "").trim())
    .filter(Boolean);

  const normalizedCurrent = normalizeTopicKey(input.title);

  const related = allTitles.filter((t) => {
    const key = normalizeTopicKey(t);
    if (!key) return false;
    return (
      key.includes(normalizedCurrent) ||
      normalizedCurrent.includes(key) ||
      key.split(" ").some((w) => w.length > 0 && normalizedCurrent.split(" ").includes(w))
    );
  });

  return {
    relatedPublishedTitles: related.slice(0, 8),
    relatedScheduledTitles: [],
    relatedDraftTitles: [],
    repeatedPatternsToAvoid: [...DEFAULT_HISTORY_PATTERNS]
  };
}

function formatLedgerBlockForPrompt(items: SeoHistoryLedgerItem[]): string {
  return items
    .map((it, i) => {
      const hints = (it.duplicateRiskHints || []).map((h) => `    - ${h}`).join("\n");
      return [
        `  ${i + 1}. title: ${it.title}`,
        `     slug: ${it.slug}`,
        `     intent: ${it.intent}; angle: ${it.angle}`,
        `     summary: ${it.summary}`,
        `     keywords: ${(it.keywords || []).join(", ")}`,
        `     duplicateRiskHints:`,
        hints || "    - (none)"
      ].join("\n");
    })
    .join("\n");
}

export type SeoArticlePlan = {
  title: string;
  searchIntent: string;
  targetReader: string;
  coreQuestions: string[];
  mustCover: string[];
  mustAvoid: string[];
  sectionOutline: string[];
  differentiation: string[];
};

export function buildSeoArticlePlan(input: { title: string; history: SeoHistoryContext }): SeoArticlePlan {
  const title = input.title.trim();
  const lower = title.toLowerCase();

  let searchIntent = "informational";
  if (lower.startsWith("how to")) searchIntent = "instructional";
  else if (lower.startsWith("best")) searchIntent = "comparison";
  else if (lower.includes(" vs ")) searchIntent = "comparison";
  else if (lower.includes("example")) searchIntent = "examples";

  return {
    title,
    searchIntent,
    targetReader: "creators, marketers, and small business users",
    coreQuestions: [
      `What does the reader actually want to know from: ${title}?`,
      "What practical decision or action should the article help with?",
      "What would make this page different from previously generated pages?"
    ],
    mustCover: [
      "direct answer to the search intent",
      "practical steps or decision criteria",
      "realistic examples or contrasts when relevant",
      "clear subheadings"
    ],
    mustAvoid: [
      "generic blog storytelling",
      "filler intro",
      "fake authority language",
      "copying old article framing",
      "repeating historical patterns"
    ],
    sectionOutline: [
      "Introduction",
      "Direct answer / definition / context",
      "Main steps or comparison body",
      "Examples / scenarios",
      "Common mistakes or tips",
      "Conclusion"
    ],
    differentiation: [
      "avoid matching old titles too closely",
      "use a different angle from related history",
      "do not repeat already-used wording patterns"
    ]
  };
}

export type SeoDraftFramework = {
  title: string;
  intent: string;
  angle: string;
  outline: string[];
  must_include: string[];
  avoid_patterns: string[];
  differentiation_notes: string[];
};

export function isAcceptableFramework(framework: unknown): boolean {
  if (!framework || typeof framework !== "object") return false;

  const o = framework as Record<string, unknown>;
  const outline = o.sectionOutline ?? o.outline;
  if (!Array.isArray(outline) || outline.length < 4) return false;

  const text = JSON.stringify(framework).toLowerCase();

  if (
    text.includes("motivational journey") ||
    text.includes("personal story") ||
    text.includes("in today's fast-paced world")
  ) {
    return false;
  }

  return true;
}

function parseFrameworkFromModelText(raw: string): Record<string, unknown> | null {
  const t = deepseekProvider.normalizeOutput(raw);
  try {
    const parsed = JSON.parse(t) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function normalizeFrameworkRecord(raw: Record<string, unknown>): SeoDraftFramework | null {
  const title = String(raw.title ?? raw.Title ?? "").trim();
  const intent = String(raw.intent ?? raw.Intent ?? "").trim();
  const angle = String(raw.angle ?? raw.Angle ?? "").trim();
  const outlineRaw = raw.outline ?? raw.sectionOutline ?? raw.section_outline;
  if (!Array.isArray(outlineRaw)) return null;
  const outline = outlineRaw.map((x) => String(x).trim()).filter(Boolean);
  const must = raw.must_include ?? raw.mustInclude;
  const avoid = raw.avoid_patterns ?? raw.avoidPatterns;
  const diff = raw.differentiation_notes ?? raw.differentiationNotes;
  const must_include = Array.isArray(must) ? must.map((x) => String(x).trim()).filter(Boolean) : [];
  const avoid_patterns = Array.isArray(avoid) ? avoid.map((x) => String(x).trim()).filter(Boolean) : [];
  const differentiation_notes = Array.isArray(diff) ? diff.map((x) => String(x).trim()).filter(Boolean) : [];

  return {
    title: title || "",
    intent: intent || "informational",
    angle: angle || "",
    outline,
    must_include,
    avoid_patterns,
    differentiation_notes
  };
}

const FRAMEWORK_SYSTEM = `You are NOT writing the article yet.
You must first study the provided history and plan.
Your job is to create a precise writing framework that avoids duplication and drift.
Output a single JSON object only (no markdown fences, no commentary) with these keys:
title (string), intent (string), angle (string), outline (array of 4-10 section heading strings), must_include (array of strings), avoid_patterns (array of strings), differentiation_notes (array of strings).
Do not write article prose.`;

export async function generateSeoDraftFramework(input: {
  title: string;
  history: SeoHistoryContext;
  plan: SeoArticlePlan;
  contentLanguage: string;
}): Promise<SeoDraftFramework | null> {
  const lang = input.contentLanguage.toLowerCase().startsWith("zh") ? "zh" : "en";
  const headingLang = lang === "zh" ? "Simplified Chinese" : "English";

  const ledgerBlock =
    input.history.ledgerItems && input.history.ledgerItems.length > 0
      ? `
PUBLISHED HISTORY LEDGER (memory — read carefully; do not repeat angles or summaries):
${formatLedgerBlockForPrompt(input.history.ledgerItems)}
`
      : "";

  const userPrompt = `TITLE: ${input.title}
${ledgerBlock}
HISTORY CONTEXT:
Related titles already on site (differentiate; do not duplicate angles):
${input.history.relatedPublishedTitles.map((t) => `- ${t}`).join("\n") || "(none matched)"}

Repeated patterns to avoid:
${input.history.repeatedPatternsToAvoid.map((p) => `- ${p}`).join("\n")}

ARTICLE PLAN (memory / analysis — follow structurally):
${JSON.stringify(input.plan, null, 2)}

Requirements:
- outline headings must be in ${headingLang}, specific to this title, not generic placeholders.
- must_include and avoid_patterns must reflect the plan and history constraints.
- differentiation_notes must name how this piece avoids overlapping the related titles above.
`;

  const model = getDeepseekModel().trim() || "deepseek-chat";
  const out = await deepseekProvider.generatePackage({
    systemPrompt: FRAMEWORK_SYSTEM,
    userPrompt,
    model,
    maxTokens: 2500,
    temperature: 0.35,
    jsonMode: true
  });

  const parsed = parseFrameworkFromModelText(out.rawText);
  if (!parsed) return null;
  return normalizeFrameworkRecord(parsed);
}

export function formatApprovedFrameworkForSections(
  framework: SeoDraftFramework,
  history: SeoHistoryContext
): string {
  const ledgerLines =
    history.ledgerItems && history.ledgerItems.length > 0
      ? [
          `Published history ledger (do not repeat intent/angle/summary patterns):`,
          ...history.ledgerItems.flatMap((it) => [
            `  - ${it.title} [${it.intent} / ${it.angle}]: ${it.summary}`,
            `    duplicateRisk: ${(it.duplicateRiskHints || []).join("; ")}`
          ])
        ]
      : [];

  const lines = [
    `Framework title (reference; article H1 may be set by editor): ${framework.title || "(same as pipeline title)"}`,
    `Intent: ${framework.intent}`,
    `Angle: ${framework.angle}`,
    `Outline (write sections in this order; use these as ## headings):`,
    ...framework.outline.map((h, i) => `  ${i + 1}. ${h}`),
    `Must include:`,
    ...framework.must_include.map((x) => `  - ${x}`),
    `Avoid patterns:`,
    ...framework.avoid_patterns.map((x) => `  - ${x}`),
    `Differentiation notes:`,
    ...framework.differentiation_notes.map((x) => `  - ${x}`),
    ...ledgerLines,
    `Related existing titles (do not echo their framing):`,
    ...(history.relatedPublishedTitles.length
      ? history.relatedPublishedTitles.map((t) => `  - ${t}`)
      : ["  (none)"])
  ];
  return lines.join("\n");
}
