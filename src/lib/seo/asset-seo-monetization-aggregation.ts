export type MonetizationEventRow = {
  event_name:
    | "upgrade_shown"
    | "upgrade_clicked"
    | "upgrade_converted"
    | "monetization_trigger_fired"
    | "conversion_completed";
  variant_id?: string | null;
  topic?: string | null;
  workflow_id?: string | null;
  generation_count_before_conversion?: number | null;
  revenue?: number | null;
};

type Perf = {
  shown: number;
  clicked: number;
  converted: number;
  revenue: number;
  ctr: number;
  conversion_rate: number;
};

function ratio(n: number, d: number): number {
  return d > 0 ? Number((n / d).toFixed(4)) : 0;
}

function toPerf(x: { shown: number; clicked: number; converted: number; revenue: number }): Perf {
  return {
    shown: x.shown,
    clicked: x.clicked,
    converted: x.converted,
    revenue: Number(x.revenue.toFixed(2)),
    ctr: ratio(x.clicked, x.shown),
    conversion_rate: ratio(x.converted, x.shown)
  };
}

export function computeVariantPerformance(rows: MonetizationEventRow[]) {
  const m: Record<string, { shown: number; clicked: number; converted: number; revenue: number }> = {};
  for (const r of rows) {
    const id = String(r.variant_id || "unknown");
    m[id] = m[id] ?? { shown: 0, clicked: 0, converted: 0, revenue: 0 };
    if (r.event_name === "upgrade_shown") m[id].shown += 1;
    if (r.event_name === "upgrade_clicked") m[id].clicked += 1;
    if (r.event_name === "upgrade_converted") {
      m[id].converted += 1;
      m[id].revenue += Number(r.revenue ?? 0);
    }
    if (r.event_name === "conversion_completed") m[id].revenue += Number(r.revenue ?? 0);
  }
  return Object.entries(m)
    .map(([variant_id, x]) => ({ variant_id, ...toPerf(x) }))
    .sort((a, b) => b.conversion_rate - a.conversion_rate || b.ctr - a.ctr);
}

export function computeTimingPerformance(rows: MonetizationEventRow[]) {
  const m: Record<number, { shown: number; clicked: number; converted: number; revenue: number }> = {};
  for (const r of rows) {
    const t = Math.max(1, Math.min(3, Math.round(Number(r.generation_count_before_conversion ?? 2))));
    m[t] = m[t] ?? { shown: 0, clicked: 0, converted: 0, revenue: 0 };
    if (r.event_name === "upgrade_shown") m[t].shown += 1;
    if (r.event_name === "upgrade_clicked") m[t].clicked += 1;
    if (r.event_name === "upgrade_converted") {
      m[t].converted += 1;
      m[t].revenue += Number(r.revenue ?? 0);
    }
    if (r.event_name === "conversion_completed") m[t].revenue += Number(r.revenue ?? 0);
  }
  return Object.entries(m)
    .map(([timing, x]) => ({ timing: Number(timing), ...toPerf(x) }))
    .sort((a, b) => b.conversion_rate - a.conversion_rate || b.revenue - a.revenue);
}

export function computeTopicMonetizationPerformance(rows: MonetizationEventRow[]) {
  const m: Record<string, { shown: number; clicked: number; converted: number; revenue: number }> = {};
  for (const r of rows) {
    const k = String(r.topic || "unknown");
    m[k] = m[k] ?? { shown: 0, clicked: 0, converted: 0, revenue: 0 };
    if (r.event_name === "upgrade_shown") m[k].shown += 1;
    if (r.event_name === "upgrade_clicked") m[k].clicked += 1;
    if (r.event_name === "upgrade_converted") {
      m[k].converted += 1;
      m[k].revenue += Number(r.revenue ?? 0);
    }
    if (r.event_name === "conversion_completed") m[k].revenue += Number(r.revenue ?? 0);
  }
  return Object.entries(m)
    .map(([topic, x]) => ({ topic, ...toPerf(x) }))
    .sort((a, b) => b.revenue - a.revenue || b.conversion_rate - a.conversion_rate);
}

export function computeWorkflowMonetizationPerformance(rows: MonetizationEventRow[]) {
  const m: Record<string, { shown: number; clicked: number; converted: number; revenue: number }> = {};
  for (const r of rows) {
    const k = String(r.workflow_id || "unknown");
    m[k] = m[k] ?? { shown: 0, clicked: 0, converted: 0, revenue: 0 };
    if (r.event_name === "upgrade_shown") m[k].shown += 1;
    if (r.event_name === "upgrade_clicked") m[k].clicked += 1;
    if (r.event_name === "upgrade_converted") {
      m[k].converted += 1;
      m[k].revenue += Number(r.revenue ?? 0);
    }
    if (r.event_name === "conversion_completed") m[k].revenue += Number(r.revenue ?? 0);
  }
  return Object.entries(m)
    .map(([workflow_id, x]) => ({ workflow_id, ...toPerf(x) }))
    .sort((a, b) => b.revenue - a.revenue || b.conversion_rate - a.conversion_rate);
}

export function aggregateMonetizationEvents(rows: MonetizationEventRow[]) {
  const variants = computeVariantPerformance(rows);
  const timings = computeTimingPerformance(rows);
  const topics = computeTopicMonetizationPerformance(rows);
  const workflows = computeWorkflowMonetizationPerformance(rows);
  return {
    variants,
    timings,
    topics,
    workflows,
    global_winner_variant: variants[0]?.variant_id ?? "v1",
    global_best_timing: (timings[0]?.timing ?? 2) as 1 | 2 | 3
  };
}

