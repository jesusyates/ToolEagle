/**
 * Search-shaped scenario lines per seed + keyword. No stacked abstract domains, no weak audience tails.
 * Lines may contain `{{keyword}}` — replaced with the seed keyword phrase (see `substituteKeywordTemplate`).
 */

export function substituteKeywordTemplate(line: string, keywordRaw: string): string {
  const kw = keywordRaw.replace(/\s+/g, " ").trim();
  if (!line.includes("{{keyword}}")) return line;
  if (!kw) {
    return line
      .replace(/\{\{keyword\}\}/gi, "")
      .replace(/\(\s*\)/g, "")
      .replace(/\s+,/g, ",")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return line.replace(/\{\{keyword\}\}/gi, kw);
}

export type ScenarioAngleKey =
  | "how_to"
  | "workflow"
  | "tools"
  | "examples"
  | "tips"
  | "comparison"
  | "explained"
  | "formulas"
  | "guide";

const ANGLES: ScenarioAngleKey[] = [
  "how_to",
  "workflow",
  "tools",
  "examples",
  "tips",
  "comparison",
  "explained",
  "formulas",
  "guide"
];

function emptyTable(): Record<ScenarioAngleKey, string[]> {
  return {
    how_to: [],
    workflow: [],
    tools: [],
    examples: [],
    tips: [],
    comparison: [],
    explained: [],
    formulas: [],
    guide: []
  };
}

function add(table: Record<ScenarioAngleKey, string[]>, angle: ScenarioAngleKey, ...lines: string[]) {
  for (const line of lines) {
    const t = line.trim();
    if (t) table[angle].push(t);
  }
}

function prependPatch(
  base: Record<ScenarioAngleKey, string[]>,
  patch: Partial<Record<ScenarioAngleKey, string[]>>
): Record<ScenarioAngleKey, string[]> {
  const out = emptyTable();
  for (const a of ANGLES) {
    const p = patch[a];
    const b = base[a];
    out[a] = [...(p ?? []), ...(b ?? [])];
  }
  return out;
}

/** Keyword-specific lines (more specific matches first in caller). */
function keywordPatch(k: string): Partial<Record<ScenarioAngleKey, string[]>> | null {
  if (k.includes("instagram")) {
    return {
      how_to: ["How to write {{keyword}} with AI (hooks, line breaks, CTAs)"],
      workflow: ["How to batch {{keyword}} in one weekly workflow with AI"],
      tools: ["Best AI tools for {{keyword}} compared (speed vs control)"],
      examples: ["{{keyword}} examples you can reuse as templates"],
      tips: ["How to make {{keyword}} sound on-brand with AI editing"],
      comparison: ["Best AI caption generators for {{keyword}} vs writing from scratch"],
      explained: ["What AI {{keyword}} tools automate vs what you should still edit"],
      formulas: ["Hook + body + CTA formulas for {{keyword}} that convert"],
      guide: ["Quick guide: {{keyword}} with AI (workflow + tools)"]
    };
  }
  if (k.includes("tiktok")) {
    return {
      how_to: ["How to write {{keyword}} with AI for short-form retention"],
      workflow: ["How to ship {{keyword}} faster with AI-assisted drafting"],
      tools: ["Best AI tools for {{keyword}} compared"],
      examples: ["{{keyword}} examples with structure you can copy"],
      tips: ["How to tighten {{keyword}} for TikTok voice and pacing"],
      comparison: ["AI TikTok {{keyword}} tools compared side by side"],
      explained: ["What TikTok {{keyword}} AI can generate vs what needs a human pass"],
      formulas: ["Short-form patterns for {{keyword}} that stop the scroll"],
      guide: ["Quick guide: {{keyword}} with AI on TikTok"]
    };
  }
  if (k.includes("youtube") && k.includes("title")) {
    return {
      how_to: ["How to write {{keyword}} with AI that still match search intent"],
      workflow: ["How to A/B test {{keyword}} ideas with AI before you publish"],
      tools: ["Best AI tools for {{keyword}} compared"],
      examples: ["{{keyword}} examples from high-CTR channels"],
      tips: ["How to avoid clickbait traps in {{keyword}} while staying compelling"],
      comparison: ["YouTube {{keyword}} generators compared for accuracy"],
      explained: ["How AI picks wording for {{keyword}} (CTR vs accuracy tradeoffs)"],
      formulas: ["Title templates for {{keyword}} that work in browse and search"],
      guide: ["Quick guide: AI-generated {{keyword}} for YouTube"]
    };
  }
  if (k.includes("email")) {
    return {
      how_to: ["How to write {{keyword}} with AI (subject line + body)"],
      workflow: ["How to iterate {{keyword}} variants with AI for tests"],
      tools: ["Best AI tools for {{keyword}} compared"],
      examples: ["{{keyword}} examples you can adapt for your list"],
      tips: ["How to keep {{keyword}} human-sounding after AI drafting"],
      comparison: ["AI {{keyword}} writers compared for deliverability and tone"],
      explained: ["What AI {{keyword}} tools optimize for (opens, clicks, compliance)"],
      formulas: ["Email formulas for {{keyword}} you can reuse with AI"],
      guide: ["Quick guide: AI-assisted {{keyword}} for marketing"]
    };
  }
  if (k.includes("product description")) {
    return {
      how_to: ["How to write {{keyword}} with AI for ecommerce conversion"],
      workflow: ["How to generate {{keyword}} variants with AI for A/B tests"],
      tools: ["Best AI tools for {{keyword}} compared"],
      examples: ["{{keyword}} examples structured for scanners and buyers"],
      tips: ["How to edit {{keyword}} so claims stay accurate"],
      comparison: ["AI {{keyword}} writers compared for Shopify-style catalogs"],
      explained: ["When {{keyword}} from AI helps—and when you need a heavy edit"],
      formulas: ["Product description templates for {{keyword}} (features, proof, CTA)"],
      guide: ["Quick guide: AI {{keyword}} for online stores"]
    };
  }
  if (k.includes("write ads") || /\bad copy\b/.test(k) || (k.includes("ads") && k.includes("ai"))) {
    return {
      how_to: ["How to write {{keyword}} with AI for paid social and search"],
      workflow: ["How to iterate {{keyword}} fast with AI creative reviews"],
      tools: ["Best AI tools for {{keyword}} compared"],
      examples: ["{{keyword}} examples with compliant claims"],
      tips: ["How to keep {{keyword}} clear under ad policy constraints"],
      comparison: ["AI {{keyword}} tools compared for variants and testing"],
      explained: ["What AI {{keyword}} writers optimize for (and common failure modes)"],
      formulas: ["Ad patterns for {{keyword}} on Meta and Google"],
      guide: ["Quick guide: AI-generated {{keyword}}"]
    };
  }
  if (k.includes("write articles") || (k.includes("article") && !k.includes("caption"))) {
    return {
      how_to: ["How to write {{keyword}} with AI from outline to publish"],
      workflow: ["How to go from brief to final {{keyword}} with AI + human QA"],
      tools: ["Best AI tools for long-form {{keyword}} compared"],
      examples: ["{{keyword}} section examples you can mirror for structure"],
      tips: ["How to keep a clear POV in {{keyword}} after AI drafting"],
      comparison: ["AI long-form {{keyword}} tools compared"],
      explained: ["What “AI {{keyword}}” workflows look like in practice"],
      formulas: ["Article outlines for {{keyword}} that rank and read well"],
      guide: ["Quick guide: AI-assisted {{keyword}}"]
    };
  }
  if (k.includes("chatgpt")) {
    return {
      how_to: ["How to use {{keyword}} for drafting and research without generic output"],
      workflow: ["How to build a repeatable {{keyword}} workflow for marketing assets"],
      tools: ["Best alternatives to {{keyword}} for marketing copy tasks"],
      examples: ["Example prompts for {{keyword}} that return structured outputs"],
      tips: ["How to get reliable answers from {{keyword}} for content work"],
      comparison: ["{{keyword}} alternatives compared for writing and research"],
      explained: ["What {{keyword}} alternatives change for teams shipping content"],
      formulas: ["Reusable prompt templates for {{keyword}} marketing tasks"],
      guide: ["Quick guide: choosing a {{keyword}} alternative for your stack"]
    };
  }
  if (k.includes("summarizer") || k.includes("summarize") || k.includes("note summar")) {
    return {
      how_to: ["How to summarize {{keyword}} with AI for studying and meetings"],
      workflow: ["How to turn messy {{keyword}} into clean study guides with AI"],
      tools: ["Best AI tools for {{keyword}} compared (PDFs, notes, transcripts)"],
      examples: ["{{keyword}} summary examples with clear takeaways"],
      tips: ["How to keep {{keyword}} summaries accurate enough to trust"],
      comparison: ["AI summarizers for {{keyword}} compared"],
      explained: ["How AI handles long {{keyword}} inputs (limits and hallucination risks)"],
      formulas: ["Summary formats for {{keyword}} (exams, standups, research)"],
      guide: ["Quick guide: AI {{keyword}} workflows"]
    };
  }
  if (k.includes("homework")) {
    return {
      how_to: ["How to use AI for {{keyword}} without skipping the learning steps"],
      workflow: ["How to check {{keyword}} with AI step by step"],
      tools: ["Best AI homework helpers for {{keyword}} compared"],
      examples: ["Example {{keyword}} prompts that force understanding, not just answers"],
      tips: ["How to use AI for {{keyword}} responsibly on tight deadlines"],
      comparison: ["AI homework tools for {{keyword}} compared"],
      explained: ["What AI can explain for {{keyword}} vs what it should not shortcut"],
      formulas: [],
      guide: ["Quick guide: AI help for {{keyword}}"]
    };
  }
  if (k.includes("study assistant") || (k.includes("study") && k.includes("ai"))) {
    return {
      how_to: ["How to study faster with {{keyword}} for exams and retention"],
      workflow: ["How to build a weekly plan with {{keyword}} for hard classes"],
      tools: ["Best {{keyword}} compared for flashcards, quizzes, and notes"],
      examples: ["Study plan examples built with {{keyword}}"],
      tips: ["How to combine active recall with {{keyword}} without cramming"],
      comparison: ["AI study tools for {{keyword}} compared"],
      explained: ["What {{keyword}} does well for revision vs live tutoring"],
      formulas: [],
      guide: ["Quick guide: {{keyword}} for students"]
    };
  }
  if (k.includes("workflow automation") || (k.includes("task") && k.includes("automation"))) {
    return {
      how_to: [
        "How to automate {{keyword}} with AI step by step",
        "How to chain {{keyword}} steps into a reliable automation with AI"
      ],
      workflow: ["How to design a {{keyword}} automation with human review gates"],
      tools: ["Best AI workflow automation tools for {{keyword}} compared"],
      examples: ["Example {{keyword}} automation sequences for publishing"],
      tips: ["How to keep {{keyword}} automation from shipping low-quality drafts"],
      comparison: ["AI workflow platforms for {{keyword}} compared"],
      explained: ["What {{keyword}} automation means when AI is in the loop"],
      formulas: ["Checklist: triggers, inputs, and QA for {{keyword}} automation"],
      guide: ["Quick guide: AI {{keyword}} automation"]
    };
  }
  return null;
}

function seedTable(seedId: string): Record<ScenarioAngleKey, string[]> {
  const t = emptyTable();
  switch (seedId) {
    case "ai-writing":
      add(
        t,
        "how_to",
        "How to write {{keyword}} with AI without sounding generic",
        "How to rewrite {{keyword}} first drafts with AI in one editing pass",
        "How to outline {{keyword}} with AI before you write the full piece"
      );
      add(
        t,
        "tools",
        "Best {{keyword}} options compared side by side",
        "Best {{keyword}} stack picks for speed vs quality",
        "Alternatives to outsourcing {{keyword}} to freelancers (AI workflow)"
      );
      add(
        t,
        "examples",
        "{{keyword}} examples with hooks, ledes, and outlines you can copy",
        "Before-and-after {{keyword}} examples improved with AI editing"
      );
      add(
        t,
        "tips",
        "How to edit {{keyword}} from AI so it matches your brand voice",
        "How to fact-check {{keyword}} when AI writes the first pass"
      );
      add(
        t,
        "comparison",
        "{{keyword}}: AI first draft vs human-only writing (when each wins)",
        "Best software picks for {{keyword}} compared on control and speed"
      );
      add(
        t,
        "workflow",
        "How to turn {{keyword}} outlines into publish-ready posts with AI",
        "How to run a weekly {{keyword}} pipeline with AI + human QA"
      );
      add(
        t,
        "explained",
        "What {{keyword}} workflows actually automate with AI (and what they exaggerate)"
      );
      add(
        t,
        "formulas",
        "{{keyword}} templates and headline formulas that work with AI drafting"
      );
      add(t, "guide", "Quick guide: {{keyword}} with AI (tools + checklist)");
      break;
    case "ai-chat":
      add(
        t,
        "how_to",
        "How to use {{keyword}} for research and drafting without generic answers",
        "How to ask {{keyword}} better questions for marketing copy tasks",
        "How to turn {{keyword}} transcripts into usable notes and briefs"
      );
      add(
        t,
        "tools",
        "Best {{keyword}} apps compared for drafting and research",
        "Alternatives to {{keyword}} for teams that need citations and memory"
      );
      add(t, "examples", "Example {{keyword}} prompts for landing pages, ads, and email");
      add(
        t,
        "tips",
        "How to get reliable answers from {{keyword}} for content workflows",
        "How to stop {{keyword}} from hallucinating facts in client-facing copy"
      );
      add(
        t,
        "comparison",
        "{{keyword}} vs dedicated copywriting AI for {{keyword}}-style tasks",
        "Best {{keyword}} alternatives compared for marketing teams"
      );
      add(t, "workflow", "How to use {{keyword}} in a daily publishing routine with guardrails");
      add(t, "explained", "What {{keyword}} assistants do well today for content work");
      add(t, "formulas", "Reusable {{keyword}} prompt templates for marketing deliverables");
      add(t, "guide", "Quick guide: picking a {{keyword}} assistant for your stack");
      break;
    case "ai-prompt":
      add(
        t,
        "how_to",
        "How to write {{keyword}} that return structured marketing outputs",
        "How to improve {{keyword}} for ads, emails, and landing pages",
        "How to iterate {{keyword}} when AI results are mediocre"
      );
      add(
        t,
        "tools",
        "Best {{keyword}} optimization tools compared",
        "Best AI prompt libraries for {{keyword}} workflows"
      );
      add(t, "examples", "{{keyword}} examples for paid social, search, and lifecycle email");
      add(
        t,
        "tips",
        "How to keep {{keyword}} short enough to reuse across campaigns",
        "How to test {{keyword}} changes without breaking production workflows"
      );
      add(t, "comparison", "AI {{keyword}} tools compared for marketing teams");
      add(t, "workflow", "How to version and share {{keyword}} across a content team");
      add(t, "explained", "What {{keyword}} optimization changes in a real publishing workflow");
      add(t, "formulas", "{{keyword}} templates for briefs, outlines, and final copy");
      add(t, "guide", "Quick guide: {{keyword}} for high-volume marketing");
      break;
    case "ai-automation":
      add(
        t,
        "how_to",
        "How to automate {{keyword}} publishing steps with AI review gates",
        "How to schedule and batch {{keyword}} with automation safely",
        "How to chain {{keyword}} tasks into one reliable automation"
      );
      add(
        t,
        "tools",
        "Best AI automation platforms for {{keyword}} compared",
        "Best workflow tools for {{keyword}} with AI in the loop"
      );
      add(t, "examples", "Example {{keyword}} automations for content and distribution");
      add(
        t,
        "tips",
        "How to keep {{keyword}} automation from shipping low-quality drafts",
        "How to add human approvals to {{keyword}} automations"
      );
      add(t, "comparison", "AI {{keyword}} automation tools compared for marketing ops");
      add(
        t,
        "workflow",
        "End-to-end {{keyword}} workflow: draft, review, publish with automation",
        "How to automate {{keyword}} handoffs between tools"
      );
      add(t, "explained", "What {{keyword}} automation can safely take off your plate");
      add(t, "formulas", "Checklist: triggers, inputs, and QA for {{keyword}} automation");
      add(t, "guide", "Quick guide: AI {{keyword}} automation for lean teams");
      break;
    case "ai-personalized":
      add(
        t,
        "how_to",
        "How to personalize {{keyword}} outputs to a consistent brand voice",
        "How to teach {{keyword}} tools your style preferences with examples",
        "How to keep {{keyword}} responses consistent across campaigns"
      );
      add(
        t,
        "tools",
        "Best personalized {{keyword}} assistants compared",
        "Adaptive {{keyword}} systems compared for marketing teams"
      );
      add(t, "examples", "{{keyword}} examples with saved tone, audience, and guardrails");
      add(
        t,
        "tips",
        "How to use memory-style {{keyword}} without leaking sensitive data",
        "How to audit {{keyword}} personalization for off-brand drift"
      );
      add(t, "comparison", "Personalized {{keyword}} assistants compared for content scale");
      add(t, "workflow", "How to roll out personalized {{keyword}} across marketing assets");
      add(t, "explained", "What adaptive {{keyword}} means for high-volume publishing");
      add(t, "formulas", "{{keyword}} templates for tone, audience, and compliance notes");
      add(t, "guide", "Quick guide: personalized {{keyword}} for content teams");
      break;
    case "ai-use-cases":
      add(
        t,
        "how_to",
        "How to write {{keyword}} with AI for ecommerce product pages",
        "How to write {{keyword}} with AI for lifecycle email",
        "How to generate {{keyword}} with AI for paid social captions"
      );
      add(
        t,
        "tools",
        "Best AI tools for {{keyword}} compared across channels",
        "Best {{keyword}} software compared for multi-channel reuse"
      );
      add(t, "examples", "{{keyword}} examples adapted for ads, email, and social");
      add(
        t,
        "tips",
        "How to reuse {{keyword}} across channels without sounding repetitive",
        "How to localize {{keyword}} variants with AI safely"
      );
      add(t, "comparison", "AI copy tools for {{keyword}} compared on speed vs control");
      add(t, "workflow", "How to reuse one {{keyword}} brief across ads, email, and social");
      add(t, "explained", "What multi-channel {{keyword}} workflows look like with AI");
      add(t, "formulas", "Channel-specific {{keyword}} patterns you can automate");
      add(t, "guide", "Quick guide: AI for {{keyword}} across marketing channels");
      break;
    case "ai-productivity":
      add(
        t,
        "how_to",
        "How to summarize {{keyword}} with AI for meetings and classes",
        "How to turn {{keyword}} into action items with AI",
        "How to extract key points from {{keyword}} PDFs with AI"
      );
      add(
        t,
        "tools",
        "Best AI summarizers for {{keyword}} compared",
        "Best {{keyword}} productivity tools compared for documents"
      );
      add(t, "examples", "{{keyword}} summary examples with clear decisions and owners");
      add(
        t,
        "tips",
        "How to keep {{keyword}} summaries accurate enough to share",
        "How to cite sources when {{keyword}} comes from long documents"
      );
      add(t, "comparison", "AI summarization tools for {{keyword}} compared");
      add(t, "workflow", "How to build a weekly {{keyword}} review workflow with AI");
      add(t, "explained", "How AI handles long {{keyword}} inputs (limits and risks)");
      add(t, "formulas", "Summary formats for {{keyword}} in meetings, classes, and research");
      add(t, "guide", "Quick guide: AI for {{keyword}} notes and documents");
      break;
    default:
      add(
        t,
        "how_to",
        "How to write {{keyword}} with AI using a repeatable brief-to-publish workflow"
      );
      add(
        t,
        "tools",
        "Best AI tools for {{keyword}} compared",
        "Alternatives to manual {{keyword}} drafting (AI + templates)"
      );
      add(t, "examples", "{{keyword}} examples with outlines you can reuse");
      add(
        t,
        "tips",
        "How to edit {{keyword}} from AI so it reads credible and specific",
        "How to add proof and numbers to {{keyword}} after an AI first draft"
      );
      add(
        t,
        "comparison",
        "{{keyword}}: AI drafting vs human-only (cost, speed, quality tradeoffs)"
      );
      add(
        t,
        "workflow",
        "How to fit {{keyword}} AI tools into a weekly publishing calendar"
      );
      add(
        t,
        "explained",
        "What {{keyword}} tools actually do in a modern AI content stack"
      );
      add(t, "formulas", "{{keyword}} templates and prompts you can standardize");
      add(t, "guide", "Quick guide: {{keyword}} with AI for search-intent content");
      break;
  }
  return t;
}

function normalizeAngle(angle: string): ScenarioAngleKey {
  const a = angle.toLowerCase();
  if (a === "how_to") return "how_to";
  if (ANGLES.includes(a as ScenarioAngleKey)) return a as ScenarioAngleKey;
  return "how_to";
}

export function concreteLinesForAngle(
  angle: string,
  seedId: string,
  keywordRaw: string
): string[] {
  const k = keywordRaw.toLowerCase().trim();
  const base = seedTable(seedId);
  const patch = keywordPatch(k);
  const merged = patch ? prependPatch(base, patch) : base;
  const key = normalizeAngle(angle);
  return merged[key];
}

export function pickConcreteLine(angle: string, seedId: string, keywordRaw: string, variantIndex: number): string | null {
  let lines = concreteLinesForAngle(angle, seedId, keywordRaw);
  if (!lines.length) {
    lines = concreteLinesForAngle("how_to", seedId, keywordRaw);
  }
  if (!lines.length) return null;
  const raw = lines[variantIndex % lines.length]!;
  return substituteKeywordTemplate(raw, keywordRaw);
}
