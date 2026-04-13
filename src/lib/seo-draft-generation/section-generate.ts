import { getDeepseekModel } from "@/config/ai-router";
import { deepseekProvider } from "@/lib/ai/providers/deepseek";

export type SectionGenerateInput = {
  title: string;
  outlineHeadings: string[];
  contentLanguage: string;
};

function mapLang(contentLanguage: string): "en" | "zh" {
  return contentLanguage.toLowerCase().startsWith("zh") ? "zh" : "en";
}

/** English words (whitespace-split; good enough for section density checks). */
export function wordCountEn(s: string): number {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function countHanChars(s: string): number {
  return (s.match(/[\u4e00-\u9fff]/g) ?? []).length;
}

/** Policy: match prompt (EN ~120–180 words, ZH ~120+ 汉字) with small slack for token variance. */
export const MIN_SECTION_WORDS_EN = 118;
export const MIN_SECTION_HAN_ZH = 118;

export function sectionMeetsMinLength(body: string, lang: "en" | "zh"): boolean {
  const t = body.trim();
  if (!t) return false;
  if (lang === "en") return wordCountEn(t) >= MIN_SECTION_WORDS_EN;
  return countHanChars(t) >= MIN_SECTION_HAN_ZH;
}

function sectionLengthDebug(body: string, lang: "en" | "zh"): { words?: number; han?: number } {
  const t = body.trim();
  if (lang === "en") return { words: wordCountEn(t) };
  return { han: countHanChars(t) };
}

/** Strict per-section user prompt (one model call per section). */
export function buildSectionUserPrompt(
  title: string,
  sectionHeading: string,
  lang: "en" | "zh",
  priorSectionsDigest = ""
): string {
  const langLine =
    lang === "zh"
      ? "\nLanguage: Write this section in Simplified Chinese.\n"
      : "\nLanguage: Write this section in English.\n";

  const lengthRule =
    lang === "zh"
      ? "* Length: at least 120 Chinese characters of substantive prose in this section (not counting headings). Prefer 120–200 characters of dense explanation.\n"
      : "* Length: **at least 120 English words**, target **120–180 words**. Count before you finish; if under 120 words, expand with specifics below.\n";

  const digestBlock =
    priorSectionsDigest.trim().length > 0
      ? `\nEarlier sections (do not repeat their points or examples; add new information only):\n${priorSectionsDigest}\n`
      : "";

  return `You are writing a high-quality SEO article.

Article title: ${title}

Current section: ${sectionHeading}
${langLine}
${digestBlock}
Rules:

* Write only for this section (no separate H2 line; the editor adds the heading).
${lengthRule}
* Explain the point clearly for a reader skimming search results.
* Include **at least one concrete example** (named scenario, before/after, small numbers, or a short mini-case).
* Include **at least one actionable takeaway** the reader can apply (imperative steps or a short checklist in prose — not a vague slogan).
* No filler, no repetition from other sections, no duplicated stock phrases.
* Provide concrete, actionable information; avoid generic advice.
* Do not use reflective patterns like:
  'I thought... what happened... then I realized...'
* Do not write introduction or conclusion unless explicitly requested.
* Keep language clear and natural.

Output only the section body text (paragraphs). No markdown heading line for this section.`;
}

/** Second attempt: model under-shot length; demand explicit expansion. */
export function buildSectionUserPromptStrict(
  title: string,
  sectionHeading: string,
  lang: "en" | "zh",
  priorSectionsDigest: string
): string {
  const base = buildSectionUserPrompt(title, sectionHeading, lang, priorSectionsDigest);
  const extra =
    lang === "zh"
      ? `\n\nCRITICAL RETRY: 上一版过短。本段必须至少 130 个汉字，并包含：一个具体例子 + 一句可执行建议。禁止空话。`
      : `\n\nCRITICAL RETRY: Your previous draft was too short. You MUST output **at least 130 English words** in this section alone. Add: (1) a named scenario or mini-case, (2) one example with concrete detail (numbers, tools, or steps), (3) a short embedded checklist of 3 actions in flowing prose (not a bullet list if that would feel like filler—integrate naturally). No generic filler.`;
  return base + extra;
}

function stripLeadingDuplicateHeading(text: string, heading: string): string {
  let t = text.trim();
  const h = heading.trim();
  const asH2 = new RegExp(`^#{1,2}\\s*${escapeRegExp(h)}\\s*`, "i");
  t = t.replace(asH2, "").trim();
  if (t.toLowerCase().startsWith(h.toLowerCase())) {
    t = t.slice(h.length).replace(/^[\s.:—\-]+/, "").trim();
  }
  return t;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenSet(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter++;
  }
  const u = a.size + b.size - inter;
  return u === 0 ? 0 : inter / u;
}

/** Split assembled markdown into section bodies (content under each ##). Order matches `headings`. */
function extractSectionBodies(fullBody: string, headings: string[]): string[] {
  const bodies: string[] = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]!.trim();
    const needle = `\n## ${h}\n`;
    let idx = fullBody.indexOf(needle);
    if (idx === -1 && fullBody.startsWith(`## ${h}\n`)) {
      idx = 0;
    }
    if (idx === -1) {
      bodies.push("");
      continue;
    }
    const start = idx === 0 ? `## ${h}\n`.length : idx + needle.length;
    const nextH = headings[i + 1]?.trim();
    let end = fullBody.length;
    if (nextH) {
      const nextNeedle = `\n## ${nextH}\n`;
      const nextIdx = fullBody.indexOf(nextNeedle, start);
      if (nextIdx !== -1) end = nextIdx;
    }
    bodies.push(fullBody.slice(start, end).trim());
  }
  return bodies;
}

export type SectionDraftValidation = { ok: boolean; reasons: string[] };

export function validateStructuredDraft(
  fullBody: string,
  headings: string[],
  lang: "en" | "zh" = "en"
): SectionDraftValidation {
  const reasons: string[] = [];
  const minTotal = 1200;
  if (fullBody.trim().length < minTotal) {
    reasons.push(`too_short:body_chars_${fullBody.trim().length}_min_${minTotal}`);
  }

  const blocks = fullBody
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/^#+\s/.test(p));
  const seen = new Map<string, number>();
  for (const b of blocks) {
    const key = b.toLowerCase().replace(/\s+/g, " ").slice(0, 500);
    if (key.length < 50) continue;
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    if (n >= 2) reasons.push("duplicate_paragraph_block");
  }

  const sectionBodies = extractSectionBodies(fullBody, headings);
  for (let i = 0; i < sectionBodies.length; i++) {
    const sec = sectionBodies[i]!.trim();
    if (!sectionMeetsMinLength(sec, lang)) {
      const dbg =
        lang === "en"
          ? `words_${wordCountEn(sec)}_min_${MIN_SECTION_WORDS_EN}`
          : `han_${countHanChars(sec)}_min_${MIN_SECTION_HAN_ZH}`;
      reasons.push(`section_too_short:${i}_${dbg}`);
    }
  }
  const minSecLenForSimilarity = lang === "en" ? 400 : 120;
  for (let i = 0; i < sectionBodies.length; i++) {
    for (let j = i + 1; j < sectionBodies.length; j++) {
      const ji = jaccard(tokenSet(sectionBodies[i]!), tokenSet(sectionBodies[j]!));
      if (
        ji >= 0.72 &&
        sectionBodies[i]!.length > minSecLenForSimilarity &&
        sectionBodies[j]!.length > minSecLenForSimilarity
      ) {
        reasons.push(`sections_too_similar:${i}_${j}_jaccard_${ji.toFixed(2)}`);
      }
    }
  }

  const reflective =
    /\bi thought\b.*\bwhat happened\b|\bthen i realized\b/i.test(fullBody) ||
    /我以为.*后来发现|然后?我(才)?意识/i.test(fullBody);
  if (reflective) {
    reasons.push("reflective_pattern_detected");
  }

  return { ok: reasons.length === 0, reasons };
}

/**
 * One API call per outline heading; assembles `# Title` + `## heading` + content per section.
 */
function buildPriorDigest(headings: string[], pieces: string[], upToExclusive: number): string {
  const lines: string[] = [];
  for (let j = 0; j < upToExclusive; j++) {
    const snippet = pieces[j]!.replace(/\s+/g, " ").trim().slice(0, 140);
    lines.push(`- ${headings[j]}: ${snippet}${pieces[j]!.length > 140 ? "…" : ""}`);
  }
  return lines.join("\n");
}

export async function generateArticleBySections(input: SectionGenerateInput): Promise<{
  body: string;
  validation: SectionDraftValidation;
}> {
  const lang = mapLang(input.contentLanguage);
  const headings = input.outlineHeadings.map((h) => h.trim()).filter(Boolean);
  if (headings.length === 0) {
    throw new Error("section_generate:no_outline_headings");
  }

  const model = getDeepseekModel().trim() || "deepseek-chat";
  const systemPrompt =
    "You write precise SEO article sections. Obey every rule in the user message. Output only the section body (no title line unless it is part of the section).";

  const pieces: string[] = [];
  for (let i = 0; i < headings.length; i++) {
    const sectionHeading = headings[i]!;
    const priorDigest = buildPriorDigest(headings, pieces, i);

    const runOnce = async (strict: boolean) => {
      const userPrompt = strict
        ? buildSectionUserPromptStrict(input.title, sectionHeading, lang, priorDigest)
        : buildSectionUserPrompt(input.title, sectionHeading, lang, priorDigest);
      const out = await deepseekProvider.generatePackage({
        systemPrompt,
        userPrompt,
        model,
        maxTokens: 3200,
        temperature: strict ? 0.35 : 0.42,
        jsonMode: false
      });
      let text = deepseekProvider.normalizeOutput(out.rawText);
      text = stripLeadingDuplicateHeading(text, sectionHeading);
      return text.trim();
    };

    let text = await runOnce(false);
    let okLen = sectionMeetsMinLength(text, lang);
    const dbg0 = sectionLengthDebug(text, lang);
    console.log(
      "[seo-section-debug]",
      JSON.stringify({
        heading: sectionHeading,
        pass: okLen,
        reason: okLen ? "ok" : "section_too_short_first_pass",
        attempt: 1,
        lang,
        ...dbg0
      })
    );

    if (!okLen) {
      text = await runOnce(true);
      okLen = sectionMeetsMinLength(text, lang);
      const dbg1 = sectionLengthDebug(text, lang);
      console.log(
        "[seo-section-debug]",
        JSON.stringify({
          heading: sectionHeading,
          pass: okLen,
          reason: okLen ? "ok_after_retry" : "section_too_short_after_retry",
          attempt: 2,
          lang,
          ...dbg1
        })
      );
    }

    pieces.push(text);
  }

  let body = `# ${input.title.trim()}\n\n`;
  for (let i = 0; i < headings.length; i++) {
    body += `## ${headings[i]}\n\n${pieces[i]}\n\n`;
  }
  body = body.trim();
  const validation = validateStructuredDraft(body, headings, lang);

  const sectionBodies = extractSectionBodies(body, headings);
  for (let i = 0; i < headings.length; i++) {
    const sec = sectionBodies[i] ?? "";
    const dbg = sectionLengthDebug(sec, lang);
    const secShort = validation.reasons.filter((r) => r.startsWith(`section_too_short:${i}_`));
    const lenOk = sectionMeetsMinLength(sec, lang);
    const pass = lenOk && secShort.length === 0;
    console.log(
      "[seo-section-debug]",
      JSON.stringify({
        phase: "assembled",
        heading: headings[i],
        pass,
        fail_reason: pass ? null : secShort[0] ?? (lenOk ? "other_structure_rule" : "section_too_short_length_check"),
        lang,
        ...dbg
      })
    );
  }

  return { body, validation };
}
