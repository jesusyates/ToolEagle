export type SeoGenerationBrief = {
  title: string;
  keyword: string;
  intent: string;
  audience: string;
  articleType: string;
  mustInclude: string[];
  mustAvoid: string[];
  structure: string[];
  qualityRules: string[];
};

export function inferIntentFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.startsWith("how to")) return "instructional";
  if (t.startsWith("best")) return "comparison";
  if (t.includes(" vs ")) return "comparison";
  if (t.includes("example")) return "examples";
  return "informational";
}

export function buildSeoGenerationBrief(input: {
  title: string;
  topic?: string;
  intent?: string;
}): SeoGenerationBrief {
  const title = (input.title || "").trim();

  return {
    title,
    keyword: title,
    intent: input.intent || inferIntentFromTitle(title),
    audience: "creators, marketers, and small business users looking for practical SEO-style answers",
    articleType: "search-intent article",
    mustInclude: [
      "clear answer to the search intent",
      "practical steps",
      "realistic examples",
      "useful subheadings",
      "actionable advice"
    ],
    mustAvoid: [
      "fluffy intro",
      "motivational filler",
      "vague claims",
      "generic SEO spam",
      "keyword stuffing",
      "fake statistics",
      "fake case studies"
    ],
    structure: [
      "intro",
      "what it is / why it matters",
      "step-by-step guidance",
      "examples or comparisons if relevant",
      "mistakes / tips",
      "short conclusion"
    ],
    qualityRules: [
      "write for search intent first",
      "be concrete and useful",
      "avoid narrative blog style",
      "avoid repeating the title wording too often",
      "make every section add new information"
    ]
  };
}

export function formatSeoBriefForPrompt(brief: SeoGenerationBrief): string {
  const lines = (items: string[]) => items.map((x) => `* ${x}`).join("\n");
  return `SEO BRIEF
Title: ${brief.title}
Primary keyword: ${brief.keyword}
Intent: ${brief.intent}
Audience: ${brief.audience}
Article type: ${brief.articleType}

Must include:
${lines(brief.mustInclude)}

Must avoid:
${lines(brief.mustAvoid)}

Required structure:
${lines(brief.structure)}

Quality rules:
${lines(brief.qualityRules)}`;
}
