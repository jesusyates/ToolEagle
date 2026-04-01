import type { CreatorStateCompactStrategy } from "@/lib/content/creator-state-strategy";

export type CreatorStateToolContext = {
  toolType: "hook" | "caption" | "hashtag" | "title" | "other";
  contextLines: string[];
};

function inferToolType(slug: string): "hook" | "caption" | "hashtag" | "title" | "other" {
  const s = slug.toLowerCase();
  if (s.includes("hook")) return "hook";
  if (s.includes("caption")) return "caption";
  if (s.includes("hashtag")) return "hashtag";
  if (s.includes("title")) return "title";
  return "other";
}

export function buildCreatorStateToolContext(
  toolSlug: string,
  strategy: CreatorStateCompactStrategy
): CreatorStateToolContext {
  const toolType = inferToolType(toolSlug);
  const lines: string[] = [];

  if (toolType === "hook") {
    if (strategy.topHooks.length > 0) {
      lines.push(`Use opening patterns similar to: "${strategy.topHooks.join(" | ")}".`);
    }
    lines.push(`After generation, ${strategy.preferredAction}.`);
  } else if (toolType === "caption") {
    lines.push(
      `Aim for ${strategy.captionLengthType} captions and keep hashtags around ${strategy.hashtagCount} tags.`
    );
    lines.push(`After generation, ${strategy.preferredAction}.`);
  } else if (toolType === "hashtag") {
    lines.push(`Target around ${strategy.hashtagCount} focused hashtags per post.`);
    lines.push(`After generation, ${strategy.preferredAction}.`);
  } else if (toolType === "title") {
    if (strategy.topHooks[0]) {
      lines.push(`Use a title that mirrors this winning opening: "${strategy.topHooks[0]}".`);
    }
    lines.push(`After generation, ${strategy.preferredAction}.`);
  } else {
    lines.push(`Next behavior focus: ${strategy.preferredAction}.`);
  }

  return {
    toolType,
    contextLines: lines.slice(0, 3)
  };
}

