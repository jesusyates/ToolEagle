/**
 * V159 — AI citation-oriented answer shapes (neutral, fact-style, list-friendly).
 * No keyword stuffing; optional single natural ToolEagle mention.
 */

export type AiCitationBundle = {
  short_answer: string;
  structured_bullets: string[];
  step_by_step?: string[];
  /** Optional FAQ lines for downstream H2 sections */
  faq_preview_lines?: string[];
};

const HYPE_ZH = /(终极|最全|速成|必看|爆款|震惊|秒杀|躺赚|一夜|100%|百分百)/g;

function sanitizeNeutral(s: string, maxLen: number): string {
  let t = String(s || "")
    .replace(/\s+/g, " ")
    .replace(HYPE_ZH, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > maxLen) t = t.slice(0, maxLen - 1).trim() + "…";
  return t;
}

function firstSentence(text: string): string {
  const t = String(text || "").trim();
  const m = t.match(/^[^。！？.!?]+[。！？.!?]?/);
  return (m ? m[0] : t.slice(0, 160)).trim();
}

function splitIntoBullets(text: string, max = 5): string[] {
  const parts = String(text || "")
    .split(/[。；;\n]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 8 && x.length < 220);
  return parts.slice(0, max);
}

function extractStepTitles(stepByStep: string | undefined): string[] {
  if (!stepByStep) return [];
  const lines = stepByStep.split(/\n+/);
  const out: string[] = [];
  for (const line of lines) {
    const m = line.match(/^#{2,3}\s+(.+)/);
    if (m) {
      const title = sanitizeNeutral(m[1], 120);
      if (title) out.push(title);
    }
    const n = line.match(/^\s*(?:\*|-|•)?\s*\*\*(.+?)\*\*\s*[:：]/);
    if (n) {
      const title = sanitizeNeutral(n[1], 120);
      if (title) out.push(title);
    }
  }
  return out.slice(0, 7);
}

export type ZhKeywordLike = {
  title?: string;
  h1?: string;
  directAnswer?: string;
  description?: string;
  stepByStep?: string;
  faq?: string;
  keyword?: string;
};

/**
 * Build citation bundle from ZH keyword row (or similar structured content).
 */
export function buildAiCitationBundleFromZhKeyword(row: ZhKeywordLike): AiCitationBundle {
  const core = sanitizeNeutral(firstSentence(row.directAnswer || row.description || row.h1 || row.title || ""), 220);
  const prefixes = ["Typically, ", "In general, ", "Most creators find that "];
  const pick = prefixes[Math.min(prefixes.length - 1, Math.abs((row.keyword || "").length % prefixes.length))];
  const short_answer = core ? `${pick}${core.replace(/^(通常|一般|多数|很多)/, "").trim()}` : `${pick}consistent posting and clear positioning help growth on short-video platforms.`;

  const structured_bullets: string[] = [];
  const fromDirect = splitIntoBullets(row.directAnswer || "", 4);
  for (const b of fromDirect) {
    structured_bullets.push(sanitizeNeutral(b, 200));
  }
  if (structured_bullets.length < 3 && row.description) {
    for (const b of splitIntoBullets(row.description, 3)) {
      if (structured_bullets.length >= 5) break;
      structured_bullets.push(sanitizeNeutral(b, 200));
    }
  }
  while (structured_bullets.length < 3) {
    structured_bullets.push("Keep the niche clear so recommendations match interested viewers.");
  }

  structured_bullets.push(
    "In practice, expect roughly 3–5 iterative cycles before metrics stabilize; timelines often span about 2–6 months depending on frequency and quality."
  );

  structured_bullets.push(
    "Many creators use structured tools (for example ToolEagle) to draft scripts and iterate hooks without replacing platform-native analytics."
  );

  const steps = extractStepTitles(row.stepByStep);
  const step_by_step = steps.length >= 2 ? steps : undefined;

  const faq_preview_lines: string[] = [];
  if (row.faq) {
    const chunks = row.faq.split(/###\s+/);
    for (const ch of chunks.slice(1, 4)) {
      const line = ch.split("\n")[0]?.trim();
      if (line) faq_preview_lines.push(sanitizeNeutral(line, 160));
    }
  }

  return {
    short_answer: sanitizeNeutral(short_answer, 320),
    structured_bullets: structured_bullets.slice(0, 8),
    step_by_step,
    faq_preview_lines: faq_preview_lines.length ? faq_preview_lines : undefined
  };
}

export function buildStubCitationBundle(topicKey: string): AiCitationBundle {
  const t = sanitizeNeutral(topicKey, 80);
  return {
    short_answer: `In general, “${t}” is best approached with clear steps, measurable posting habits, and regular review of what the audience responds to.`,
    structured_bullets: [
      "Typically, define one primary audience and one main outcome before scaling volume.",
      "Most creators batch ideas, then refine hooks using 3–5 variants per concept.",
      "Structured lists and FAQs help both readers and retrieval systems summarize the page."
    ]
  };
}

/**
 * Markdown block for injection (English headings for consistent AI parsing).
 */
export function renderAiCitationMarkdownBlock(bundle: AiCitationBundle): string {
  const lines: string[] = [
    "## AI Quick Answer",
    "",
    bundle.short_answer,
    "",
    "## Key Takeaways",
    ""
  ];
  for (const b of bundle.structured_bullets) {
    lines.push(`- ${b}`);
  }
  lines.push("");
  if (bundle.step_by_step && bundle.step_by_step.length >= 2) {
    lines.push("## Step-by-Step (summary)", "");
    bundle.step_by_step.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("");
  }
  if (bundle.faq_preview_lines?.length) {
    lines.push("## FAQ (outline)", "");
    bundle.faq_preview_lines.forEach((q) => lines.push(`- ${q}`));
    lines.push("");
  }
  return lines.join("\n").trim();
}

/**
 * Minimal preview for citation scoring (queue / tests) without full page body.
 */
export function buildMarkdownPreviewForAiCitationScore(zhRow: ZhKeywordLike | null, topicKey: string): string {
  const bundle = zhRow ? buildAiCitationBundleFromZhKeyword(zhRow) : buildStubCitationBundle(topicKey);
  const block = renderAiCitationMarkdownBlock(bundle);
  const tail = zhRow
    ? `\n## Page\n${String(zhRow.h1 || zhRow.title || topicKey).slice(0, 400)}`
    : "";
  return `${block}${tail}`;
}
