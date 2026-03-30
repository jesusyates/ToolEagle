import rules from "../../../generated/v191-analysis-rules.json";

function hasAny(text: string, keys: string[]): boolean {
  const t = text.toLowerCase();
  return keys.some((k) => t.includes(k.toLowerCase()));
}

export type ItemSignals = {
  tutorial: number;
  story: number;
  selling: number;
  opinion: number;
  listicle: number;
};

export function scoreItemSignals(block: string): ItemSignals {
  const tutorialK = rules.tutorial_signals as string[];
  const storyK = rules.story_signals as string[];
  const sellK = rules.selling_signals as string[];
  const opinionK = rules.opinion_signals as string[];
  const listK = rules.listicle_signals as string[];

  return {
    tutorial: hasAny(block, tutorialK) ? 1 : 0,
    story: hasAny(block, storyK) ? 1 : 0,
    selling: hasAny(block, sellK) ? 1 : 0,
    opinion: hasAny(block, opinionK) ? 1 : 0,
    listicle: hasAny(block, listK) ? 1 : 0
  };
}

export function blockForItem(item: { title?: string; caption?: string; description?: string; cta?: string }): string {
  return [item.title, item.caption, item.description, item.cta].filter(Boolean).join("\n");
}
