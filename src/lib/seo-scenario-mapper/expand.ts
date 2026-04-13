import type { AppSeoSeedRecord } from "@/lib/seo-seed-registry";
import type { ScenarioMappedTopic } from "./types";
import { buildNaturalScenarioTopic, buildSellingPointTopic } from "./natural-scenario-topics";

const DEFAULT_ANGLES = ["how_to", "workflow", "tools", "examples", "tips"];

function normLocaleFromLanguage(lang: string): string {
  const l = lang.trim().toLowerCase();
  if (l.startsWith("zh")) return l.includes("tw") ? "zh-TW" : "zh-CN";
  if (l.startsWith("en")) return "en";
  return l || "en";
}

function dedupeKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export type MapScenariosOptions = {
  defaultMarket?: string;
  defaultLocale?: string;
  defaultContentLanguage?: string;
};

export function mapSeedsToScenarioTopics(
  seeds: AppSeoSeedRecord[],
  opts?: MapScenariosOptions
): { topics: ScenarioMappedTopic[]; deduped: number; skippedLowQuality: number } {
  const defaultMarket = opts?.defaultMarket ?? "global";
  const defaultContentLanguage = opts?.defaultContentLanguage ?? "en";
  const defaultLocale = opts?.defaultLocale ?? normLocaleFromLanguage(defaultContentLanguage);

  const out: ScenarioMappedTopic[] = [];
  const seen = new Set<string>();
  let skippedDup = 0;
  let skippedLowQuality = 0;

  for (const seed of seeds) {
    const market = seed.markets[0]?.trim() || defaultMarket;
    const contentLanguage = seed.languages[0]?.trim() || defaultContentLanguage;
    const locale = seed.languages.length ? normLocaleFromLanguage(seed.languages[0]!) : defaultLocale;
    const angles = seed.angles.length > 0 ? seed.angles : DEFAULT_ANGLES;

    for (const kw of seed.keywords) {
      const phrase = kw.trim();
      if (!phrase) continue;
      for (const angle of angles) {
        const topic = buildNaturalScenarioTopic(angle, seed, phrase);
        if (!topic) {
          skippedLowQuality++;
          continue;
        }
        const k = dedupeKey(topic);
        if (seen.has(k)) {
          skippedDup++;
          continue;
        }
        seen.add(k);
        out.push({
          topic,
          contentType: "guide",
          intent: angle,
          market,
          locale,
          contentLanguage,
          seedId: seed.id,
          feature: seed.feature,
          platform: seed.platform,
          angle
        });
      }
    }

    if (Array.isArray(seed.sellingPoints)) {
      for (const sp of seed.sellingPoints) {
        const t = buildSellingPointTopic(seed, sp);
        if (!t) {
          if (sp.trim()) skippedLowQuality++;
          continue;
        }
        const k = dedupeKey(t);
        if (!sp.trim() || seen.has(k)) {
          if (sp.trim() && seen.has(k)) skippedDup++;
          continue;
        }
        seen.add(k);
        out.push({
          topic: t,
          contentType: "guide",
          intent: "selling_point",
          market,
          locale,
          contentLanguage,
          seedId: seed.id,
          feature: seed.feature,
          platform: seed.platform,
          angle: "selling_point"
        });
      }
    }
  }

  return { topics: out, deduped: skippedDup, skippedLowQuality };
}
