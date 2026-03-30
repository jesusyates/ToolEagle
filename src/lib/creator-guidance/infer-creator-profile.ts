/**
 * V187 — Infer creator_level, primary_goal, dominant_style from Creator Memory (behavior-based).
 */

import type { CreatorMemoryV187 } from "@/lib/creator-guidance/creator-memory-store";

export type InferredCreatorProfile = {
  creator_level: "beginner" | "intermediate" | "advanced";
  primary_goal: "views" | "followers" | "sales";
  dominant_style: "educational" | "selling" | "storytelling";
};

export function inferCreatorProfile(memory: CreatorMemoryV187): InferredCreatorProfile {
  const gens = memory.generation_history.length;
  const copies = memory.copy_events.length;
  const tools = new Set(memory.tool_usage_history.map((x) => x.tool_slug));
  const diversity = tools.size;

  let creator_level: InferredCreatorProfile["creator_level"] = "beginner";
  if (gens + copies >= 25 && diversity >= 3) creator_level = "advanced";
  else if (gens + copies >= 8 || diversity >= 2) creator_level = "intermediate";

  const hookCopies = memory.copy_events.filter((c) => c.result_type === "hook").length;
  const hashCopies = memory.copy_events.filter((c) => c.result_type === "hashtags").length;
  const captionCopies = memory.copy_events.filter((c) => c.result_type === "caption").length;
  const metaCopies = memory.copy_events.filter((c) => c.result_type === "meta").length;

  let primary_goal: InferredCreatorProfile["primary_goal"] = "views";
  const intentRaw = (memory.last_v186_intent_id ?? "").toLowerCase();
  const shopSignals =
    intentRaw.includes("shop") ||
    intentRaw === "intent_promote" ||
    memory.niche_hints.some((n) => /shop|sell|affiliate|product/i.test(n));
  if (shopSignals) {
    primary_goal = "sales";
  } else if (metaCopies + hashCopies > hookCopies + captionCopies + 1) {
    primary_goal = "followers";
  }

  let dominant_style: InferredCreatorProfile["dominant_style"] = "educational";
  if (intentRaw.includes("story")) dominant_style = "storytelling";
  else if (intentRaw.includes("promote") || intentRaw.includes("shop") || intentRaw.includes("sell"))
    dominant_style = "selling";
  else if (intentRaw.includes("tutorial") || memory.tool_usage_history.some((t) => t.tool_slug.includes("caption"))) {
    dominant_style = "educational";
  }

  return { creator_level, primary_goal, dominant_style };
}
