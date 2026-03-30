import type { ContentMix } from "@/lib/creator-analysis/types";
import { blockForItem, scoreItemSignals } from "@/lib/creator-analysis/extract-patterns";

function normalizeMix(raw: Record<keyof ContentMix, number>): ContentMix {
  const sum = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  const out: ContentMix = { tutorial: 0, storytelling: 0, selling: 0, opinion: 0, listicle: 0, other: 0 };
  (Object.keys(out) as (keyof ContentMix)[]).forEach((k) => {
    out[k] = Math.round((raw[k] / sum) * 1000) / 10;
  });
  return out;
}

export function aggregateContentMix(
  items: { title?: string; caption?: string; description?: string; cta?: string }[]
): { mix: ContentMix; selling_mix: number; tutorial_mix: number; story_mix: number } {
  const acc: Record<keyof ContentMix, number> = {
    tutorial: 0,
    storytelling: 0,
    selling: 0,
    opinion: 0,
    listicle: 0,
    other: 0
  };

  for (const it of items) {
    const block = blockForItem(it);
    const s = scoreItemSignals(block);
    const scores: Record<keyof ContentMix, number> = {
      tutorial: s.tutorial * 2.2 + s.listicle * 0.4,
      storytelling: s.story * 2.2,
      selling: s.selling * 2.4,
      opinion: s.opinion * 2.2,
      listicle: s.listicle * 2,
      other: 0.35
    };
    let best: keyof ContentMix = "other";
    let bestV = -1;
    (Object.keys(scores) as (keyof ContentMix)[]).forEach((k) => {
      if (scores[k] > bestV) {
        bestV = scores[k];
        best = k;
      }
    });
    acc[best] += 1;
  }

  const n = items.length || 1;
  const mix = normalizeMix(acc);
  const selling_mix = (mix.selling + mix.listicle * 0.25) / 100;
  const tutorial_mix = (mix.tutorial + mix.listicle * 0.55) / 100;
  const story_mix = mix.storytelling / 100;

  return { mix, selling_mix, tutorial_mix, story_mix };
}

export function inferDominantStyle(mix: ContentMix, ctaCoverage: number): string {
  if (mix.selling > 22 || ctaCoverage > 0.55) return "Direct response / salesy";
  if (mix.storytelling > mix.tutorial && mix.storytelling > 18) return "Conversational / story-led";
  if (mix.opinion > 18) return "Opinion / commentary energy";
  if (mix.tutorial + mix.listicle > 45) return "Educational / calm";
  return "Conversational / friendly";
}
