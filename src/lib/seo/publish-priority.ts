export type SeoPriorityInput = {
  title: string;
  review_status?: string;
};

export type SeoPriorityResult = {
  score: number;
  reasons: string[];
};

function hasHighValuePattern(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.startsWith("how to") ||
    t.startsWith("best") ||
    t.includes(" vs ") ||
    t.includes("compared") ||
    t.includes("example")
  );
}

function hasWeakPattern(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes("roadmap") ||
    t.includes("goals") ||
    t.includes("systems") ||
    t.includes("plan") ||
    t.includes("guessing") ||
    t.includes("story")
  );
}

function isCommercialish(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes("tool") ||
    t.includes("tools") ||
    t.includes("software") ||
    t.includes("generator") ||
    t.includes("compare") ||
    t.includes("compared") ||
    t.includes("vs")
  );
}

function isActionable(title: string): boolean {
  return title.toLowerCase().startsWith("how to");
}

export function scoreSeoPublishPriority(input: SeoPriorityInput): SeoPriorityResult {
  const title = (input.title || "").trim();
  const reasons: string[] = [];
  let score = 0;

  if (input.review_status === "publish_ready") {
    score += 40;
    reasons.push("qa_passed");
  }

  if (hasHighValuePattern(title)) {
    score += 20;
    reasons.push("strong_search_intent");
  }

  if (isCommercialish(title)) {
    score += 20;
    reasons.push("commercial_value");
  }

  if (isActionable(title)) {
    score += 10;
    reasons.push("actionable_intent");
  }

  if (title.length >= 35 && title.length <= 70) {
    score += 5;
    reasons.push("good_title_length");
  }

  if (hasWeakPattern(title)) {
    score -= 25;
    reasons.push("weak_pattern");
  }

  return {
    score,
    reasons
  };
}
