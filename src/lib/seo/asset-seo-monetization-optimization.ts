import fs from "node:fs";
import path from "node:path";

export const ASSET_SEO_MONETIZATION_OPTIMIZATION_ARTIFACT = "generated/asset-seo-monetization-optimization.json";

export type VariantEventRow = {
  variant_id: string;
  shown: number;
  clicked: number;
  converted: number;
  revenue: number;
  topic?: string;
  generation_count_before_conversion?: number;
};

function ratio(n: number, d: number): number {
  return d > 0 ? Number((n / d).toFixed(4)) : 0;
}

export function computeMonetizationOptimization(rows: VariantEventRow[]) {
  const byVariantRaw: Record<string, { shown: number; clicked: number; converted: number; revenue: number }> = {};
  const byTopicRaw: Record<string, { revenue: number; shown: number; converted: number }> = {};
  const timingRaw: Record<number, number> = {};
  for (const r of rows) {
    const id = String(r.variant_id || "unknown");
    byVariantRaw[id] = byVariantRaw[id] ?? { shown: 0, clicked: 0, converted: 0, revenue: 0 };
    byVariantRaw[id].shown += Number(r.shown || 0);
    byVariantRaw[id].clicked += Number(r.clicked || 0);
    byVariantRaw[id].converted += Number(r.converted || 0);
    byVariantRaw[id].revenue += Number(r.revenue || 0);
    const topic = String(r.topic || "unknown");
    byTopicRaw[topic] = byTopicRaw[topic] ?? { revenue: 0, shown: 0, converted: 0 };
    byTopicRaw[topic].revenue += Number(r.revenue || 0);
    byTopicRaw[topic].shown += Number(r.shown || 0);
    byTopicRaw[topic].converted += Number(r.converted || 0);
    if (typeof r.generation_count_before_conversion === "number" && r.converted > 0) {
      const t = Math.max(1, Math.min(3, Math.round(r.generation_count_before_conversion)));
      timingRaw[t] = (timingRaw[t] ?? 0) + Number(r.converted || 0);
    }
  }
  const variants = Object.entries(byVariantRaw).map(([variant_id, v]) => ({
    variant_id,
    ctr: ratio(v.clicked, v.shown),
    conversion_rate: ratio(v.converted, v.shown),
    revenue: Number(v.revenue.toFixed(2))
  }));
  const winning_variant = [...variants].sort((a, b) => b.conversion_rate - a.conversion_rate || b.ctr - a.ctr)[0]?.variant_id ?? "none";
  const top_monetizing_topics = Object.entries(byTopicRaw)
    .map(([topic, v]) => ({
      topic,
      revenue: Number(v.revenue.toFixed(2)),
      conversion_rate: ratio(v.converted, v.shown)
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const underperforming_topics = [...top_monetizing_topics]
    .sort((a, b) => a.conversion_rate - b.conversion_rate)
    .slice(0, 10);
  const best_trigger_timing = Number(
    Object.entries(timingRaw).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] ?? 2
  );

  return {
    version: "v152.0",
    updatedAt: new Date().toISOString(),
    variants,
    winning_variant,
    best_trigger_timing,
    top_monetizing_topics,
    underperforming_topics
  };
}

export function writeMonetizationOptimizationToDisk(
  payload: ReturnType<typeof computeMonetizationOptimization>,
  repoRoot: string = process.cwd()
): string {
  const out = path.join(repoRoot, ASSET_SEO_MONETIZATION_OPTIMIZATION_ARTIFACT.split("/").join(path.sep));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return out;
}

