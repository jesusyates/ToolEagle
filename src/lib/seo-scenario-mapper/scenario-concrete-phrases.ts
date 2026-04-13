/**
 * Search-shaped scenario lines per seed + keyword. No stacked abstract domains, no weak audience tails.
 */

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
      how_to: ["How to write Instagram captions with AI"],
      workflow: ["How to plan and batch Instagram posts with AI"],
      tools: ["Best AI tools for Instagram captions"],
      examples: ["Instagram caption examples you can steal the structure from"],
      tips: ["Tips for Instagram captions written with AI"],
      comparison: ["Best AI caption generators compared"],
      explained: ["What Instagram caption generators do well (and where they fail)"],
      formulas: ["Caption hooks and formulas that work on Instagram"],
      guide: ["Quick guide: AI-generated Instagram captions"]
    };
  }
  if (k.includes("tiktok")) {
    return {
      how_to: ["How to write TikTok captions with AI"],
      workflow: ["How to ship TikTok content faster with AI-assisted captions"],
      tools: ["Best AI tools for TikTok captions"],
      examples: ["TikTok caption examples written with AI"],
      tips: ["Tips for TikTok captions that match your niche"],
      comparison: ["AI TikTok caption tools compared"],
      explained: ["What TikTok caption AI can and cannot replace"],
      formulas: ["Short-form caption patterns for TikTok"],
      guide: ["Quick guide: AI captions for TikTok"]
    };
  }
  if (k.includes("youtube") && k.includes("title")) {
    return {
      how_to: ["How to write YouTube titles with AI"],
      workflow: ["How to test YouTube title ideas with AI before you publish"],
      tools: ["Best AI tools for YouTube titles"],
      examples: ["YouTube title examples generated with AI"],
      tips: ["Tips for click-worthy YouTube titles with AI help"],
      comparison: ["YouTube title generators compared"],
      explained: ["How AI title generators pick wording (simple breakdown)"],
      formulas: ["Title patterns that work for YouTube search and browse"],
      guide: ["Quick guide: AI-generated YouTube titles"]
    };
  }
  if (k.includes("email")) {
    return {
      how_to: ["How to write marketing emails with AI"],
      workflow: ["How to draft and iterate marketing emails with AI"],
      tools: ["Best AI tools for marketing email copy"],
      examples: ["Marketing email examples drafted with AI"],
      tips: ["Tips for marketing emails that still sound human"],
      comparison: ["AI email copy tools compared"],
      explained: ["What AI email writers are good at (deliverability and tone notes)"],
      formulas: ["Email copy formulas you can reuse with AI"],
      guide: ["Quick guide: AI-assisted email marketing copy"]
    };
  }
  if (k.includes("product description")) {
    return {
      how_to: ["How to write product descriptions with AI"],
      workflow: ["How to produce product description variants with AI"],
      tools: ["Best AI tools for product descriptions"],
      examples: ["Product description examples written with AI"],
      tips: ["Tips for product descriptions that convert"],
      comparison: ["AI product description writers compared"],
      explained: ["When AI product descriptions help—and when to edit heavily"],
      formulas: ["Product description structure that works for ecommerce"],
      guide: ["Quick guide: AI product descriptions"]
    };
  }
  if (k.includes("write ads") || /\bad copy\b/.test(k) || (k.includes("ads") && k.includes("ai"))) {
    return {
      how_to: ["How to write ad copy with AI"],
      workflow: ["How to iterate ad creative copy with AI"],
      tools: ["Best AI tools for ad copy"],
      examples: ["Ad copy examples drafted with AI"],
      tips: ["Tips for ad copy that stays compliant and clear"],
      comparison: ["AI ad copy tools compared"],
      explained: ["What AI ad writers optimize for (and common pitfalls)"],
      formulas: ["Ad copy patterns for paid social and search"],
      guide: ["Quick guide: AI-generated ad copy"]
    };
  }
  if (k.includes("write articles") || (k.includes("article") && !k.includes("caption"))) {
    return {
      how_to: ["How to write articles with AI"],
      workflow: ["How to go from outline to draft with AI"],
      tools: ["Best AI tools for long-form articles"],
      examples: ["Article intros and sections drafted with AI"],
      tips: ["Tips for long-form articles that keep a human point of view"],
      comparison: ["AI article writers compared"],
      explained: ["What “AI article writing” usually means in practice"],
      formulas: ["Article structures that rank and read well"],
      guide: ["Quick guide: AI-assisted article writing"]
    };
  }
  if (k.includes("chatgpt")) {
    return {
      how_to: ["How to use ChatGPT-style assistants for drafting and research"],
      workflow: ["How to build a simple ChatGPT workflow for content drafts"],
      tools: ["ChatGPT alternatives for marketing copy"],
      examples: ["Example prompts that work well in ChatGPT-style tools"],
      tips: ["Tips for getting reliable answers from AI chat tools"],
      comparison: ["ChatGPT alternatives compared for writing tasks"],
      explained: ["What ChatGPT alternatives solve for teams shipping content"],
      formulas: ["Reusable prompt patterns for marketing copy"],
      guide: ["Quick guide: choosing a ChatGPT alternative"]
    };
  }
  if (k.includes("summarizer") || k.includes("summarize") || k.includes("note summar")) {
    return {
      how_to: ["How to summarize lecture notes with AI"],
      workflow: ["How to turn messy notes into study guides with AI"],
      tools: ["Best AI tools for summarizing notes"],
      examples: ["Note summary examples created with AI"],
      tips: ["Tips for summaries you can actually study from"],
      comparison: ["AI summarizers compared for notes and PDFs"],
      explained: ["How AI summarization handles long documents"],
      formulas: ["Summary formats that work for exams and meetings"],
      guide: ["Quick guide: AI note summarization"]
    };
  }
  if (k.includes("homework")) {
    return {
      how_to: ["How to use AI for homework help without skipping the learning"],
      workflow: ["How to check your work with AI step by step"],
      tools: ["Best AI homework helpers compared"],
      examples: ["Example homework prompts that encourage understanding"],
      tips: ["Tips for using AI homework tools responsibly"],
      comparison: ["AI homework helpers compared"],
      explained: ["What AI homework tools can explain vs just answer"],
      formulas: [],
      guide: ["Quick guide: AI homework help"]
    };
  }
  if (k.includes("study assistant") || (k.includes("study") && k.includes("ai"))) {
    return {
      how_to: ["How to study faster with an AI study assistant"],
      workflow: ["How to build a weekly study plan with AI"],
      tools: ["Best AI study assistants compared"],
      examples: ["Study plan examples built with AI"],
      tips: ["Tips for active studying with AI support"],
      comparison: ["AI study tools compared"],
      explained: ["What AI study assistants do well for revision"],
      formulas: [],
      guide: ["Quick guide: AI-assisted studying"]
    };
  }
  if (k.includes("workflow automation") || (k.includes("task") && k.includes("automation"))) {
    return {
      how_to: ["How to automate repetitive workflows with AI", "How to chain steps into a reliable automation with AI"],
      workflow: ["How to design an automation workflow for publishing"],
      tools: ["Best AI workflow automation tools compared"],
      examples: ["Example automation sequences for content publishing"],
      tips: ["Tips for automation that keeps a human review gate"],
      comparison: ["AI workflow automation platforms compared"],
      explained: ["What workflow automation means when AI is in the loop"],
      formulas: ["Checklist: triggers, inputs, and QA for automated publishing"],
      guide: ["Quick guide: AI workflow automation"]
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
        "How to write blog posts with AI",
        "How to rewrite rough drafts with AI",
        "How to generate outlines for long-form content with AI"
      );
      add(
        t,
        "tools",
        "Best AI writing tools compared",
        "Best AI content generators for long-form writing",
        "Best AI copywriting software compared"
      );
      add(
        t,
        "examples",
        "Examples of landing page copy drafted with AI",
        "Examples of blog intros written with AI"
      );
      add(t, "tips", "Tips for AI-generated blog posts that still sound like you");
      add(t, "comparison", "AI writing tools compared: what to pick");
      add(
        t,
        "workflow",
        "How to edit AI drafts into publish-ready posts",
        "How to go from outline to final draft with AI"
      );
      add(t, "explained", "What AI writing software actually automates");
      add(t, "formulas", "Headline and lede formulas that work with AI drafting");
      add(t, "guide", "Quick guide: AI writing tools for beginners");
      break;
    case "ai-chat":
      add(
        t,
        "how_to",
        "How to use AI chat for research and drafting",
        "How to ask better questions in AI chat tools",
        "How to turn chat transcripts into usable notes"
      );
      add(t, "tools", "Best AI chat tools compared", "Best AI assistants for everyday questions");
      add(t, "examples", "Example chat prompts for marketing research");
      add(t, "tips", "Tips for reliable answers from AI chatbots");
      add(
        t,
        "comparison",
        "ChatGPT alternatives for marketing copy",
        "AI chat apps compared for drafting and research"
      );
      add(t, "workflow", "How to use AI chat in a daily publishing routine");
      add(t, "explained", "What AI chat assistants are best at today");
      add(t, "formulas", "Prompt patterns that work well in AI chat");
      add(t, "guide", "Quick guide: picking an AI chat assistant");
      break;
    case "ai-prompt":
      add(
        t,
        "how_to",
        "How to improve prompts for marketing copy",
        "How to write prompts that return structured outputs",
        "How to iterate prompts when results are mediocre"
      );
      add(t, "tools", "Best AI prompt generators compared", "Best prompt optimization tools compared");
      add(t, "examples", "Example prompts for ads, emails, and landing pages");
      add(t, "tips", "Tips for prompt engineering without overcomplicating it");
      add(t, "comparison", "AI prompt tools compared");
      add(t, "workflow", "How to keep a prompt library that scales");
      add(t, "explained", "What prompt optimization tools change in your workflow");
      add(t, "formulas", "Reusable prompt templates for marketing tasks");
      add(t, "guide", "Quick guide: AI prompt assistants");
      break;
    case "ai-automation":
      add(
        t,
        "how_to",
        "How to automate content publishing with AI",
        "How to automate repetitive marketing tasks with AI",
        "How to schedule and batch content with automation"
      );
      add(t, "tools", "Best AI automation tools compared", "Best AI workflow automation platforms compared");
      add(t, "examples", "Example automations for content pipelines");
      add(t, "tips", "Tips for automation that does not break editorial quality");
      add(t, "comparison", "AI automation tools compared");
      add(
        t,
        "workflow",
        "How to automate social media content with AI",
        "End-to-end workflow: draft, review, publish with automation"
      );
      add(t, "explained", "What AI content automation can safely take off your plate");
      add(t, "formulas", "Checklist: automation triggers worth implementing first");
      add(t, "guide", "Quick guide: AI workflow automation");
      break;
    case "ai-personalized":
      add(
        t,
        "how_to",
        "How to personalize AI outputs to your brand voice",
        "How to teach an AI assistant your style preferences",
        "How to keep AI responses consistent across campaigns"
      );
      add(t, "tools", "Best personalized AI assistants compared", "Adaptive AI systems compared");
      add(t, "examples", "Examples of brand-voice prompts and saved preferences");
      add(t, "tips", "Tips for memory-style AI without leaking sensitive data");
      add(t, "comparison", "Personalized AI assistants compared");
      add(t, "workflow", "How to roll out personalized AI across marketing assets");
      add(t, "explained", "What adaptive AI usually means for high-volume publishing");
      add(t, "formulas", "Templates for storing tone, audience, and guardrails");
      add(t, "guide", "Quick guide: personalized AI for content");
      break;
    case "ai-use-cases":
      add(
        t,
        "how_to",
        "How to write product descriptions with AI",
        "How to write marketing emails with AI",
        "How to generate social captions with AI"
      );
      add(t, "tools", "Best AI tools for marketing copy", "Best AI tools for social content");
      add(t, "examples", "Examples of multi-channel copy drafted with AI");
      add(t, "tips", "Tips for reuse without sounding repetitive across channels");
      add(t, "comparison", "AI copy tools compared for multi-channel use");
      add(t, "workflow", "How to reuse one brief across ads, email, and social with AI");
      add(t, "explained", "What multi-channel AI copy workflows look like in practice");
      add(t, "formulas", "Channel-specific copy patterns you can automate");
      add(t, "guide", "Quick guide: AI for multi-channel marketing copy");
      break;
    case "ai-productivity":
      add(
        t,
        "how_to",
        "How to summarize long documents with AI",
        "How to turn meeting notes into action items with AI",
        "How to extract key points from PDFs with AI"
      );
      add(t, "tools", "Best AI summarizers compared", "Best AI productivity tools for documents");
      add(t, "examples", "Examples of meeting notes cleaned up with AI");
      add(t, "tips", "Tips for summaries that stay accurate");
      add(t, "comparison", "AI summarization tools compared");
      add(t, "workflow", "How to build a weekly review workflow with AI summaries");
      add(t, "explained", "How AI summarization handles long PDFs and transcripts");
      add(t, "formulas", "Summary formats for meetings, classes, and research");
      add(t, "guide", "Quick guide: AI for notes and documents");
      break;
    default:
      add(t, "how_to", "How to use AI tools effectively for everyday content tasks");
      add(t, "tools", "Best AI tools compared for common creator tasks");
      add(t, "examples", "Examples of strong AI-assisted drafts");
      add(t, "tips", "Tips for editing AI output quickly");
      add(t, "comparison", "AI tools compared: what to pick first");
      add(t, "workflow", "How to fit AI tools into a simple weekly content routine");
      add(t, "explained", "What modern AI writing tools are responsible for");
      add(t, "formulas", "Reusable patterns for prompts and outlines");
      add(t, "guide", "Quick guide: AI tools for creators");
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
  return lines[variantIndex % lines.length]!;
}
