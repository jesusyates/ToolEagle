"use client";

import assets from "@/config/creator-knowledge-engine/v186-assets.json";

type Props = {
  toolSlug: string;
  intentId: string;
  scenarioId: string;
  locale?: string;
};

/**
 * V188 — Visible V186 context above results (1 line + subline).
 */
export function V186ContextStrip({ toolSlug, intentId, scenarioId, locale = "en" }: Props) {
  if (locale.startsWith("zh")) return null;
  const intents = assets.intent_chips[toolSlug as keyof typeof assets.intent_chips] ?? [];
  const scenarios = assets.scenario_chips[toolSlug as keyof typeof assets.scenario_chips] ?? [];
  const il = intents.find((x) => x.id === intentId)?.label ?? intentId;
  const sl = scenarios.find((x) => x.id === scenarioId)?.label ?? scenarioId;

  return (
    <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50/90 px-3 py-2.5 text-sm text-sky-950">
      <p className="font-semibold">
        Optimized for: <span className="text-sky-900">{il}</span>
        <span className="mx-1 text-sky-600">→</span>
        <span className="text-sky-900">{sl}</span>
      </p>
      <p className="mt-0.5 text-xs text-sky-900/85">Knowledge Engine blends these into retrieval + recipe before the model runs.</p>
    </div>
  );
}
