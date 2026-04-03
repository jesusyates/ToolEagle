import { getClusterPublishGeminiModel, getDeepseekModel } from "@/config/ai-router";
import { deepseekProvider } from "@/lib/ai/providers/deepseek";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import type { ProviderGenerateOutput, ProviderTextInput } from "@/lib/ai/providers/types";

export type RebuildArticleInput = {
  title: string;
  context?: string;
  contentType?: "guide" | "ideas";
};

export type FaqItem = { question: string; answer: string };

export type RebuildArticleResult = {
  title: string;
  body: string;
  hashtags: string[];
  /** True when template or offline path used instead of a successful model JSON parse. */
  fallbackUsed: boolean;
  /** 80–200 chars; answers the title question (no body truncation). */
  aiSummary: string;
  faqs: FaqItem[];
};

/** Structured SEO guide (pillar-style); only used when contentType === "guide". */
type GuideJson = {
  title?: string;
  introduction?: string;
  why_it_matters?: string;
  steps?: { title?: string; body?: string }[];
  common_mistakes?: string[];
  practical_tips?: string[];
  conclusion?: string;
  hashtags?: string[];
  ai_summary?: string;
  faqs?: { question?: string; answer?: string }[];
};

type JsonIdeasShape = {
  title?: string;
  intro?: string;
  ideas?: { line?: string; detail?: string; text?: string; note?: string }[];
  closing?: string;
  hashtags?: string[];
  ai_summary?: string;
  faqs?: { question?: string; answer?: string }[];
};

export function parseClusterFromContext(ctx?: string): { keyword?: string; cluster?: string } {
  const c = ctx ?? "";
  const kw = /Keyword:\s*([^\n]+)/i.exec(c);
  const cl = /Cluster theme:\s*([^\n]+)/i.exec(c);
  return { keyword: kw?.[1]?.trim(), cluster: cl?.[1]?.trim() };
}

function normalizeAiSummary(raw: string, title: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  if (s.length < 80) {
    s = `${s} This guide gives you a clear order of operations for "${title.slice(0, 60)}" so you can apply it on a realistic weekly cadence.`;
    s = s.replace(/\s+/g, " ").trim();
  }
  if (s.length > 200) {
    const cut = s.slice(0, 200);
    const lastPeriod = cut.lastIndexOf(".");
    s = lastPeriod > 100 ? cut.slice(0, lastPeriod + 1) : cut.replace(/\s+\S*$/, "").trimEnd() + ".";
  }
  return s.slice(0, 200);
}

function normalizeFaqsFromModel(raw: unknown): FaqItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out: FaqItem[] = [];
  for (const x of raw) {
    if (x && typeof x === "object") {
      const q = String((x as { question?: string }).question ?? "").trim();
      const a = String((x as { answer?: string }).answer ?? "").trim();
      if (q.length > 0 && a.length > 0) out.push({ question: q, answer: a });
    }
  }
  if (out.length < 3) return null;
  return out.slice(0, 5);
}

function buildFallbackFaqs(
  title: string,
  cluster: string | undefined,
  mode: "guide" | "ideas"
): FaqItem[] {
  const theme = cluster?.trim() || "this creator topic";
  const base = [
    {
      question: "Is this for beginners?",
      answer: `Yes. It breaks down "${title.slice(0, 90)}" into steps you can follow without prior expertise, with mistakes to avoid up front.`
    },
    {
      question: "What mistake costs people the most time here?",
      answer: `Posting without a single promised outcome per video. This guide under ${theme} emphasizes one arc per post and a clear next step for viewers.`
    },
    {
      question: "What strategy should I use first?",
      answer: `Start by defining the outcome in one sentence, then align hook, proof, and CTA to that line before you add complexity or new formats.`
    },
    {
      question: "How often should I apply this?",
      answer:
        mode === "ideas"
          ? `Batch hooks and film on a fixed day weekly; publish on alternating days so you can read comments and adjust one variable at a time.`
          : `Run the steps for two posting cycles, compare saves and watch time, then change only one lever so results stay legible.`
    }
  ];
  if (mode === "guide") {
    base.push({
      question: "Where should I start in the article?",
      answer: `Read Introduction and Why it matters, then execute the steps in order; use Practical tips when you get stuck on execution details.`
    });
  }
  return base.slice(0, 5);
}

export function getPublishedGuideAnswer(post: {
  title: string;
  description: string;
  body: string;
  aiSummary?: string;
  contentType?: string;
  clusterTheme?: string;
}): string {
  if (post.aiSummary?.trim()) return normalizeAiSummary(post.aiSummary, post.title);
  if (post.description?.trim().length >= 80) return normalizeAiSummary(post.description, post.title);
  return buildFallbackAiSummary(post.title, post.clusterTheme, post.contentType === "ideas" ? "ideas" : "guide");
}

export function getPublishedGuideFaqs(post: {
  title: string;
  faqs?: FaqItem[];
  contentType?: string;
  clusterTheme?: string;
}): FaqItem[] {
  if (post.faqs && post.faqs.length >= 3) return post.faqs.slice(0, 5);
  return buildFallbackFaqs(post.title, post.clusterTheme, post.contentType === "ideas" ? "ideas" : "guide");
}

function buildFallbackAiSummary(title: string, cluster: string | undefined, mode: "guide" | "ideas"): string {
  const t = title.trim() || "Creator growth";
  const c = cluster?.trim();
  const core = c
    ? `If you are working on ${t} within ${c}, you need a repeatable workflow: one clear promise per post, proof viewers can verify, and a next step they can do today.`
    : `If you are working on ${t}, you need a repeatable workflow: one clear promise per post, proof viewers can verify, and a next step they can do today.`;
  const tail =
    mode === "ideas"
      ? ` The list below gives distinct angles so you can rotate hooks without sounding repetitive.`
      : ` The sections below walk through why this matters, what to do in order, and how to avoid the usual failure modes.`;
  return normalizeAiSummary(core + tail, t);
}

function normalizeHashtags(raw: string[] | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => String(h).trim())
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h.replace(/^#+/, "")}`));
}

function sectionsToMarkdown(sections: { heading: string; body: string }[]): string {
  return sections
    .map((s) => `## ${s.heading}\n\n${s.body.trim()}`)
    .join("\n\n")
    .trim();
}

function countParagraphs(text: string): number {
  return text
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;
}

function isGuideJsonValid(g: GuideJson): boolean {
  const intro = (g.introduction ?? "").trim();
  const why = (g.why_it_matters ?? "").trim();
  const conc = (g.conclusion ?? "").trim();
  if (intro.length < 80 || why.length < 80 || conc.length < 60) return false;
  const steps = Array.isArray(g.steps) ? g.steps : [];
  if (steps.length < 3) return false;
  for (const s of steps) {
    const b = String(s?.body ?? "").trim();
    const t = String(s?.title ?? "").trim();
    if (!t || b.length < 120) return false;
    if (countParagraphs(b) < 2) return false;
  }
  const mistakes = Array.isArray(g.common_mistakes) ? g.common_mistakes.map((x) => String(x).trim()).filter(Boolean) : [];
  const tips = Array.isArray(g.practical_tips) ? g.practical_tips.map((x) => String(x).trim()).filter(Boolean) : [];
  if (mistakes.length < 3 || tips.length < 3) return false;
  for (const m of mistakes) if (m.length < 50) return false;
  for (const t of tips) if (t.length < 50) return false;
  return true;
}

function guideStructuredToMarkdown(g: GuideJson): string {
  const parts: string[] = [];
  parts.push(`## Introduction\n\n${(g.introduction ?? "").trim()}`);
  parts.push(`## Why it matters\n\n${(g.why_it_matters ?? "").trim()}`);
  const steps = g.steps ?? [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const title = String(s?.title ?? "").trim() || `Step ${i + 1}`;
    parts.push(`## Step ${i + 1}: ${title}\n\n${String(s?.body ?? "").trim()}`);
  }
  const mist = (g.common_mistakes ?? []).map((x, i) => `${i + 1}. ${String(x).trim()}`).join("\n\n");
  parts.push(`## Common mistakes\n\n${mist}`);
  const tips = (g.practical_tips ?? []).map((x, i) => `${i + 1}. ${String(x).trim()}`).join("\n\n");
  parts.push(`## Practical tips\n\n${tips}`);
  parts.push(`## Conclusion\n\n${(g.conclusion ?? "").trim()}`);
  return parts.join("\n\n").trim();
}

function fallbackGuideArticle(input: RebuildArticleInput): RebuildArticleResult {
  const base = input.title.trim() || "Creator topic";
  const ctx = (input.context ?? "").trim();
  const audienceNote = ctx ? ` Use this alongside: ${ctx.slice(0, 280)}.` : "";

  const introduction = `Readers searching for "${base}" usually want a repeatable workflow—not one-off inspiration.${audienceNote} This guide assumes you publish short-form video or carousel content and can dedicate a few hours per week to execution. You will leave with a clear order of operations, not a bag of disconnected tricks.`;

  const why_it_matters = `Getting this right changes whether your content compounds or resets to zero every week. Platforms reward clarity of promise, proof, and next step; vague posts burn watch time without building trust. When you align format, pacing, and CTA with the same underlying problem statement, analytics become legible: you can see which lever actually moved saves or follows. That is the difference between guessing and running a simple growth loop.`;

  const steps = [
    {
      title: "Define the outcome in one sentence",
      body: `Start by writing the single outcome a viewer should believe after thirty seconds. Not a vibe—an outcome: "they know how to fix X" or "they know what mistake to stop making."\n\nSay it out loud. If you cannot, your hook will waffle. Pin that sentence above your script or outline so every line either supports it or gets cut.`
    },
    {
      title: "Build one arc per post",
      body: `Pick one tension, one shift, and one proof. Tension names the pain in plain language; shift is your insight; proof is a demo, screenshot, or before/after. Do not stack three unrelated tips in one post—that reads like a listicle and trains viewers to scroll away.\n\nIf you need more ideas, film another post. One arc keeps retention and makes comments easier to answer because the question is singular.`
    },
    {
      title: "Publish, read comments, iterate once",
      body: `Ship the first version without chasing perfection. In the first hour, reply to comments with one clarifying question or one micro-tip—this signals freshness to the algorithm and surfaces language your audience actually uses.\n\nOn the next post, steal one phrase from comments and put it in the opening line. That loop is how "${base}" stops being abstract and becomes a system you can repeat.`
    }
  ];

  const common_mistakes = [
    `Leading with credentials or brand name before the problem is named. Viewers decide in one swipe; if the first line does not promise a payoff, they leave.`,
    `Using the same hook structure on every post so the feed feels templated. Templates help workflow but kill curiosity if the rhythm never changes.`,
    `Ending without a specific next step. "Follow for more" is not a step; "comment your niche and I will reply with one line to fix your hook" is.`
  ];

  const practical_tips = [
    `Film three hooks before you pick one: contrarian, proof-first, and story-led. Read them aloud; keep the one with the cleanest breath pattern.`,
    `Add on-screen text for the outcome in the first two seconds so sound-off viewers still get the premise.`,
    `Batch b-roll in one block of time so weekly posting does not depend on daily inspiration.`
  ];

  const conclusion = `Apply the three steps in order for your next two posts about "${base}". Compare saves and average watch time before you change more than one variable. Consistency of structure beats novelty of wording until the baseline is stable.`;

  const g: GuideJson = {
    introduction,
    why_it_matters,
    steps,
    common_mistakes,
    practical_tips,
    conclusion
  };

  const title = `${base}: a practical guide`;
  const body = guideStructuredToMarkdown(g);
  const hashtags = ["#creatortutorial", "#contentstrategy", "#shortform", "#howto"];
  const { cluster } = parseClusterFromContext(input.context);
  const aiSummary = buildFallbackAiSummary(title, cluster, "guide");
  const faqs = buildFallbackFaqs(title, cluster, "guide");
  return { title, body, hashtags, fallbackUsed: true, aiSummary, faqs };
}

function fallbackIdeasArticle(input: RebuildArticleInput): RebuildArticleResult {
  const base = input.title.trim() || "Creator topic";
  const ctx = (input.context ?? "").trim();
  const intro = `## Introduction\n\nUse this list when you need fast, swipeable angles for "${base}". ${ctx ? `Context: ${ctx.slice(0, 320)}` : "Each item is a hook or caption stem plus a single line on when to use it."} Copy, adapt to your voice, and avoid posting the same angle twice in a row.\n`;

  const templates = [
    ["Pattern interrupt", "Open with a wrong belief, then flip it in line two."],
    ["Proof-first", "Show the result in frame one, then explain how you got there."],
    ["Micro-story", "Three beats: setup, conflict, one takeaway—under twenty seconds."],
    ["Tutorial tease", "Promise one step viewers can do before they leave the app."],
    ["Audience call-in", "Ask a binary question; reply to the first ten comments fast."],
    ["Before/after frame", "Split screen: old habit vs new habit with one label each."],
    ["Myth vs fact", "State the myth as a headline, debunk with one concrete example."],
    ["List hook", "Number the list in speech; show two items, tease the rest in caption."],
    ["Day-in-life", "Anchor to a time block (morning/night) so the hook feels specific."],
    ["Object POV", "Let a prop “speak” the hook; cut to you for the CTA."],
    ["Trend remix", "Name the trend, then show your niche-specific twist."],
    ["Sound-off safe", "Lead with text on screen; voiceover adds detail, not setup."],
    ["CTA ladder", "Save for later, comment for part two, follow for the series."],
    ["Comparison", "This vs that—pick sides and show one proof for each."],
    ["Starter prompt", "Give a fill-in-the-blank line viewers can steal verbatim."]
  ];

  const lines: string[] = [intro, `## Ideas (numbered)\n`];
  const n = Math.max(10, templates.length);
  for (let i = 0; i < n; i++) {
    const [name, note] = templates[i % templates.length];
    lines.push(`${i + 1}. **${name} (${base.slice(0, 40)})** — ${note}`);
    lines.push(`   *Use when:* you need variety ${i % 3 === 0 ? "for cold traffic" : i % 3 === 1 ? "for warm followers" : "for a product tie-in"}.\n`);
  }

  lines.push(`## Closing suggestion\n\nPick three ideas, film them same setup, and post on alternate days. Track saves; double down on the pattern that wins for "${base.slice(0, 60)}".`);

  const title = `${base}: ${n} angles to post this week`;
  const body = lines.join("\n").trim();
  const hashtags = ["#contentideas", "#hooks", "#captions", "#creatorlife"];
  const { cluster } = parseClusterFromContext(input.context);
  const aiSummary = buildFallbackAiSummary(title, cluster, "ideas");
  const faqs = buildFallbackFaqs(title, cluster, "ideas");
  return { title, body, hashtags, fallbackUsed: true, aiSummary, faqs };
}

function parseJson(raw: string): unknown {
  const t = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function parseJsonIdeas(raw: string): JsonIdeasShape | null {
  const g = parseJson(raw);
  return g && typeof g === "object" ? (g as JsonIdeasShape) : null;
}

function ideasToMarkdown(data: JsonIdeasShape, fallbackTitle: string): string {
  const intro = typeof data.intro === "string" && data.intro.trim() ? data.intro.trim() : "";
  const closing = typeof data.closing === "string" && data.closing.trim() ? data.closing.trim() : "";
  const parts: string[] = [];
  parts.push(`## Introduction\n\n${intro || `Fresh angles for ${fallbackTitle}.`}`);
  parts.push(`## Ideas (numbered)\n`);
  const ideas = Array.isArray(data.ideas) ? data.ideas : [];
  let n = 0;
  for (let i = 0; i < ideas.length; i++) {
    const it = ideas[i];
    const line = String(it?.line ?? it?.text ?? "").trim();
    const detail = String(it?.detail ?? it?.note ?? "").trim();
    if (!line) continue;
    n++;
    parts.push(`${n}. **${line}**${detail ? ` — ${detail}` : ""}`);
  }
  parts.push(`## Closing suggestion\n\n${closing || "Rotate hooks, measure saves, and reuse the top two formats."}`);
  return parts.join("\n\n").trim();
}

/**
 * Turn a legacy title/context into a full SEO-style article (not a post package).
 */
export async function rebuildToSeoArticle(input: RebuildArticleInput): Promise<RebuildArticleResult> {
  const mode = input.contentType ?? "guide";
  const apiOk = await geminiProvider.healthCheck();
  if (!apiOk) {
    return mode === "ideas" ? fallbackIdeasArticle(input) : fallbackGuideArticle(input);
  }

  const model = getClusterPublishGeminiModel().trim() || "gemini-2.5-flash";
  const deepseekModel = getDeepseekModel().trim() || "deepseek-chat";

  const generateWithFallback = async (args: ProviderTextInput): Promise<ProviderGenerateOutput> => {
    try {
      console.info("[rebuild-article] primary provider=gemini");
      const out = await geminiProvider.generateText!(args);
      console.info("[rebuild-article] primary success=gemini");
      return out;
    } catch (e) {
      console.warn("[fallback] gemini -> deepseek", (e as Error)?.message ?? e);
      try {
        const out = await deepseekProvider.generatePackage({
          ...args,
          model: deepseekModel,
          jsonMode: args.jsonMode ?? false
        });
        console.info("[fallback] deepseek success");
        return out;
      } catch (fallbackErr) {
        console.warn("[fallback] deepseek failed", (fallbackErr as Error)?.message ?? fallbackErr);
        throw fallbackErr;
      }
    }
  };

  if (mode === "ideas") {
    const system = `You are an SEO editor. Output ONE JSON object only (no markdown fences). Shape:
{
  "title": string (search-friendly),
  "intro": string (2+ sentences, introduction only),
  "ideas": [ { "line": string (hook/caption/idea line), "detail": string (one sentence: when to use or how to adapt) }, ... ],
  "closing": string (2+ sentences: what to do next),
  "hashtags": [ "#tag1", ... ] (4-8 tags),
  "ai_summary": string (English, 80-200 characters, 2-4 sentences that directly answer the question implied by the title; no bullet points),
  "faqs": [ { "question": string, "answer": string }, ... ] (3-5 items: beginner, mistakes, strategy, timing or frequency)
}
Rules:
- Provide AT LEAST 10 items in "ideas". Each must have non-empty "line" and "detail".
- Lines must be distinct; no duplicate stems.
- "ai_summary" and "faqs" are required.
- This is a listicle for creators, not a package JSON.`;

    const user = `Topic title: ${input.title.trim()}
${input.context?.trim() ? `Context:\n${input.context.trim().slice(0, 6000)}` : ""}

Produce the JSON.`;

    let out;
    try {
      out = await generateWithFallback({
        systemPrompt: system,
        userPrompt: user,
        model,
        maxTokens: 4000,
        temperature: 0.45,
        jsonMode: true
      });
    } catch (e) {
      console.warn("[rebuild-article] ideas generate failed, template fallback:", (e as Error)?.message ?? e);
      return fallbackIdeasArticle(input);
    }

    const normalized =
      out.providerId === "deepseek"
        ? deepseekProvider.normalizeOutput(out.rawText)
        : geminiProvider.normalizeOutput(out.rawText);
    const data = parseJsonIdeas(normalized);
    const title =
      typeof data?.title === "string" && data.title.trim() ? data.title.trim() : input.title.trim();
    const ideas = Array.isArray(data?.ideas) ? data.ideas : [];
    const valid = ideas.filter((it) => {
      const line = String(it?.line ?? it?.text ?? "").trim();
      const detail = String(it?.detail ?? it?.note ?? "").trim();
      return line.length > 0 && detail.length > 0;
    });
    if (valid.length < 10) {
      return fallbackIdeasArticle(input);
    }

    const body = ideasToMarkdown({ ...data, ideas: valid }, input.title);
    const hashtags = normalizeHashtags(data?.hashtags);
    const ctx = parseClusterFromContext(input.context);
    const aiSummary =
      typeof data?.ai_summary === "string" && data.ai_summary.trim().length >= 40
        ? normalizeAiSummary(data.ai_summary, title)
        : buildFallbackAiSummary(title, ctx.cluster, "ideas");
    const faqs =
      normalizeFaqsFromModel(data?.faqs) ?? buildFallbackFaqs(title, ctx.cluster, "ideas");
    return {
      title,
      body,
      hashtags: hashtags.length > 0 ? hashtags.slice(0, 8) : ["#contentideas", "#hooks", "#seo"],
      fallbackUsed: false,
      aiSummary,
      faqs
    };
  }

  const system = `You are a senior SEO editor writing pillar-style guides for creators. Output ONE JSON object only (no markdown fences).

Required shape:
{
  "title": string (search-optimized, <= 90 chars),
  "introduction": string (2+ short paragraphs separated by \\n\\n: state the problem, who this is for, what they will get),
  "why_it_matters": string (2+ paragraphs separated by \\n\\n: stakes, platform behavior, why this beats random tips—do NOT repeat introduction wording),
  "steps": [
    { "title": string, "body": string },
    ... at least 3 objects
  ],
  "common_mistakes": [ "string", ... at least 3 distinct mistakes, each 2+ sentences or one long sentence with concrete detail ],
  "practical_tips": [ "string", ... at least 3 tips that are execution-focused and NOT paraphrases of the steps or mistakes ],
  "conclusion": string (2+ sentences, actionable close),
  "hashtags": [ "#tag1", ... ] (5-8 tags),
  "ai_summary": string (English, 80-200 characters, 2-4 sentences that directly answer the question implied by the title; no bullet points),
  "faqs": [ { "question": string, "answer": string }, ... ] (3-5 items: beginner, mistakes, strategy, timing or frequency)
}

Hard rules:
- "steps" must have >= 3 items. Each "body" must contain TWO paragraphs minimum, separated by \\n\\n (blank line). Each paragraph >= 3 sentences. Teach different sub-skills; no duplicate titles.
- "common_mistakes" and "practical_tips" must each have >= 3 entries; content must add new angles, not restate steps.
- Total depth: write long enough that the full article would feel like a serious SEO page, not a thin outline.
- "ai_summary" and "faqs" are required.
- No TikTok JSON package fields.`;

  const user = `Topic: ${input.title.trim()}
${input.context?.trim() ? `Context:\n${input.context.trim().slice(0, 6000)}` : ""}

Produce the JSON.`;

  let out;
  try {
    out = await generateWithFallback({
      systemPrompt: system,
      userPrompt: user,
      model,
      maxTokens: 6500,
      temperature: 0.42,
      jsonMode: true
    });
  } catch (e) {
    console.warn("[rebuild-article] guide generate failed, template fallback:", (e as Error)?.message ?? e);
    return fallbackGuideArticle(input);
  }

  const normalized =
    out.providerId === "deepseek"
      ? deepseekProvider.normalizeOutput(out.rawText)
      : geminiProvider.normalizeOutput(out.rawText);
  const raw = parseJson(normalized);
  const data = raw && typeof raw === "object" ? (raw as GuideJson) : null;

  const title =
    typeof data?.title === "string" && data.title.trim() ? data.title.trim() : input.title.trim();

  if (!data || !isGuideJsonValid(data)) {
    return fallbackGuideArticle(input);
  }

  const hashtags = normalizeHashtags(data.hashtags);
  const body = guideStructuredToMarkdown({ ...data, title });
  const ctx = parseClusterFromContext(input.context);
  const aiSummary =
    typeof data?.ai_summary === "string" && data.ai_summary.trim().length >= 40
      ? normalizeAiSummary(data.ai_summary, title)
      : buildFallbackAiSummary(title, ctx.cluster, "guide");
  const faqs =
    normalizeFaqsFromModel(data?.faqs) ?? buildFallbackFaqs(title, ctx.cluster, "guide");

  return {
    title,
    body,
    hashtags: hashtags.length > 0 ? hashtags.slice(0, 8) : ["#creatorcontent", "#seo", "#howto"],
    fallbackUsed: false,
    aiSummary,
    faqs
  };
}
