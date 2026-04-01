export type CreatorStateToolType = "hook" | "caption" | "hashtag" | "title" | "other";

export function scoreCreatorStateToolContext(toolType: CreatorStateToolType, contextLines: string[]): {
  rankedLines: string[];
  topLine: string;
  weightScore: number;
} {
  const lines = (Array.isArray(contextLines) ? contextLines : []).filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0
  );
  const preferredLines = lines.filter((l) => /after generation|next behavior focus/i.test(l));
  const toolSpecificLines = lines.filter((l) => !/after generation|next behavior focus/i.test(l));

  const hasPreferred = preferredLines.length > 0;
  const hasToolSpecific = toolSpecificLines.length > 0;
  const weightScore = hasToolSpecific && hasPreferred ? 80 : hasToolSpecific ? 60 : hasPreferred ? 40 : 0;

  const order = (items: string[], matcher: RegExp): string[] => {
    const hit = items.filter((l) => matcher.test(l));
    const rest = items.filter((l) => !matcher.test(l));
    return [...hit, ...rest];
  };

  let orderedSpecific = [...toolSpecificLines];
  if (toolType === "caption") {
    orderedSpecific = order(order(orderedSpecific, /caption|short|medium|long/i), /hashtag/i);
  } else if (toolType === "hashtag") {
    orderedSpecific = order(orderedSpecific, /hashtag/i);
  } else if (toolType === "hook") {
    orderedSpecific = order(orderedSpecific, /opening|hook/i);
  } else if (toolType === "title") {
    orderedSpecific = order(orderedSpecific, /title|opening|winning/i);
  }

  const ranked =
    toolType === "other"
      ? [...preferredLines, ...orderedSpecific]
      : [...orderedSpecific, ...preferredLines];
  const rankedLines = ranked.slice(0, 3);

  return {
    rankedLines,
    topLine: rankedLines[0] ?? "",
    weightScore
  };
}

