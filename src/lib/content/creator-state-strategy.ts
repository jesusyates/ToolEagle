import type { CreatorState } from "@/lib/content/creator-state";

export type CreatorStateCompactStrategy = {
  hashtagCount: number;
  captionLengthType: "short" | "medium" | "long";
  topHooks: string[];
  preferredAction: string;
};

export function buildCreatorStateStrategy(state: CreatorState): CreatorStateCompactStrategy {
  const hashtagCount =
    typeof state.strategy?.hashtagCount === "number" && state.strategy.hashtagCount > 0
      ? state.strategy.hashtagCount
      : 5;
  const captionLengthType =
    state.strategy?.captionLengthType === "short" ||
    state.strategy?.captionLengthType === "medium" ||
    state.strategy?.captionLengthType === "long"
      ? state.strategy.captionLengthType
      : "medium";
  const topHooks = Array.isArray(state.strategy?.topHooks)
    ? state.strategy.topHooks.slice(0, 3)
    : [];
  const preferredAction =
    (state.actions?.[0]?.trim() || "complete one real publish");
  return {
    hashtagCount,
    captionLengthType,
    topHooks,
    preferredAction
  };
}

