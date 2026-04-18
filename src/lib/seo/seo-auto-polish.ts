/**
 * Post-generation SEO polish for title + description (English drafts).
 * Does not rewrite body content.
 * Title grammar layer: structure + automatic cleanup to “publishable” phrasing.
 */

export function inferContentTypeFromText(
  title: string,
  content: string
): "vs" | "howto" | "examples" | "tools" {
  const t = (title + " " + content).toLowerCase();

  if (/\bvs\b|compare|comparison/.test(t)) return "vs";
  if (/^how\s+to\b|how\s+to\s/.test(title.toLowerCase())) return "howto";
  if (/example|case|sample/.test(t)) return "examples";
  return "tools";
}

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Strip 20xx years and stray “in …” glue before/after grammar pass. */
function stripYears(s: string): string {
  return (s || "")
    .replace(/\b20\d{2}\b/g, "")
    .replace(/\bin\s+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitleGrammar(s: string): string {
  let t = s || "";

  t = t.replace(/\b20\d{2}\b/g, "");

  t = t.replace(/\bcompared\s+vs\b/gi, "vs");
  t = t.replace(/\bin\s+vs\b/gi, "vs");
  t = t.replace(/\bvs\s+vs\b/gi, "vs");

  t = t.replace(/^best\s+how to\b/gi, "How to");
  t = t.replace(/^how to\s+best\b/gi, "How to");
  t = t.replace(/^best\s+best\b/gi, "Best");
  t = t.replace(/^how to\s+how to\b/gi, "How to");

  t = t.replace(/\bfor\s+([A-Za-z]+)\s+for\b/gi, "for ");
  t = t.replace(/\bcompared\s+compared\b/gi, "compared");
  t = t.replace(/\bexamples\s+examples\b/gi, "examples");

  t = t.replace(/\bfor marketing teams for creators\b/gi, "for creators");
  t = t.replace(/\bfor creators for marketing teams\b/gi, "for marketing teams");

  t = t.replace(/\bthat works? well\b/gi, "");
  t = t.replace(/\bplaybook\b/gi, "");
  t = t.replace(/\bframework\b/gi, "");
  t = t.replace(/\bstrategy\b/gi, "");
  t = t.replace(/\bultimate\s+guide\b/gi, "");
  t = t.replace(/\bcomplete\s+guide\b/gi, "");

  t = t.replace(/\s+:\s+/g, ": ");
  t = t.replace(/\s+/g, " ").trim();

  t = t.replace(/^(for|in|vs)\b\s*/i, "");
  t = t.replace(/\b(for|in|vs)$/i, "").trim();

  return t;
}

export function polishSeoTitle(originalTitle: string, content: string): string {
  const type = inferContentTypeFromText(originalTitle, content);

  let cleaned = (originalTitle || "")
    .replace(/that works? well/gi, "")
    .replace(/\bstrategy\b|\bframework\b|\bultimate\s+guide\b|\bcomplete\s+guide\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned
    .replace(/^best\b/i, "")
    .replace(/^how\s+to\b/i, "")
    .replace(/\bexamples?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = normalizeTitleGrammar(stripYears(cleaned));

  let finalTitle: string;
  switch (type) {
    case "vs": {
      if (!/\bvs\b/i.test(cleaned)) {
        finalTitle = normalizeSpaces(`${cleaned} vs AI Generated Copy`);
      } else {
        finalTitle = normalizeSpaces(`${cleaned}: Which Works Better`);
      }

      if (/\bvs\b/i.test(finalTitle)) {
        const parts = finalTitle.split(/\bvs\b/i).map((x) => x.trim()).filter(Boolean);
        if (parts.length < 2 && parts[0]) {
          finalTitle = normalizeSpaces(`${parts[0]} vs AI Generated Copy`);
        }
      }
      break;
    }

    case "howto": {
      let t = normalizeSpaces(`How to ${cleaned}`);

      if (!/\bwithout\b/i.test(t)) {
        t += " Without Wasting Time";
      }

      finalTitle = normalizeSpaces(t);
      break;
    }

    case "examples": {
      finalTitle = normalizeSpaces(`Best ${cleaned} Examples That Actually Work`);
      break;
    }

    case "tools":
    default: {
      finalTitle = normalizeSpaces(`Best ${cleaned} That Actually Work`);
      break;
    }
  }

  finalTitle = normalizeTitleGrammar(stripYears(finalTitle));
  return finalTitle;
}

export function generateSeoDescription(title: string, content?: string): string {
  const topic = normalizeTitleGrammar(stripYears(title || ""))
    .replace(/\bBest\b/gi, "")
    .replace(/\bHow to\b/gi, "")
    .replace(/\bExamples\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const description = `Learn ${topic}, including practical examples, proven tactics, and actionable tips to help you get better results.`;
  return normalizeTitleGrammar(stripYears(description));
}
