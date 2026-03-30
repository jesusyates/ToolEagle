/**
 * @jest-environment node
 */

import fs from "fs";
import os from "os";
import path from "path";
import {
  buildRetrievalOptimizationPlan,
  RETRIEVAL_OPTIMIZATION_PLAN_VERSION,
  writeRetrievalOptimizationPlan
} from "@/lib/seo/retrieval-optimizer";
import { SYSTEM_MAP_VERSION, writeSystemMapJson } from "@/lib/seo/system-map";

describe("retrieval-optimizer (V168)", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ret-opt-"));
    const gen = path.join(tmp, "generated");
    fs.mkdirSync(gen, { recursive: true });
    fs.writeFileSync(
      path.join(gen, "workflow-assets-retrieval.json"),
      JSON.stringify({ item_count: 5, items: [], buckets: { by_workflow: {} } }, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      path.join(gen, "seo-retrieval-stats.json"),
      JSON.stringify({ retrieval_count: 0, ai_generation_count: 0 }, null, 2),
      "utf8"
    );
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("writes plan with version and recommendations array", () => {
    const plan = buildRetrievalOptimizationPlan(tmp, new Date("2026-03-30T10:00:00.000Z"), {
      apply: false
    });
    expect(plan.version).toBe(RETRIEVAL_OPTIMIZATION_PLAN_VERSION);
    expect(Array.isArray(plan.recommendations)).toBe(true);
    expect(plan).toHaveProperty("env_suggestions");
    writeRetrievalOptimizationPlan(tmp, plan);
    const disk = JSON.parse(
      fs.readFileSync(path.join(tmp, "generated", "retrieval-optimization-plan.json"), "utf8")
    );
    expect(disk.recommendations.length).toBeGreaterThan(0);
  });
});

describe("system-map (V169/V170)", () => {
  it("writeSystemMapJson has required top-level keys", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sys-map-"));
    try {
      const doc = writeSystemMapJson(tmp, new Date("2026-03-30T10:00:00.000Z"));
      expect(doc.version).toBe(SYSTEM_MAP_VERSION);
      expect(doc.production_entry).toBe("daily-engine");
      expect(doc.v171_convergence?.content_quality_gate).toBeDefined();
      expect(doc.v171_1_ux?.zh_content_cleaner).toBeDefined();
      expect(doc.v172_generation?.high_quality_generation).toBeDefined();
      expect(doc.v172_generation?.retrieval_guided_generation).toBeDefined();
      expect(doc.v172_generation?.content_deduplication).toBeDefined();
      expect(doc.v173_ramp?.production_ramp_control).toBeDefined();
      expect(doc.v173_ramp?.adaptive_degradation).toBeDefined();
      expect(doc.v173_ramp?.topic_production_control).toBeDefined();
      expect(doc.v174_scale?.controlled_scale_execution).toBeDefined();
      expect(doc.v174_scale?.growth_feedback_loop).toBeDefined();
      expect(doc.v174_scale?.page_value_scoring).toBeDefined();
      expect(doc.v175_data_activation?.data_activation).toBe("active");
      expect(doc.v175_data_activation?.data_freshness_monitor).toBe("active");
      expect(doc.v176_growth_execution?.growth_execution).toBe("active");
      expect(doc.v176_growth_execution?.winner_amplification).toBe("active");
      expect(doc.v176_growth_execution?.ctr_optimization).toBe("active");
      expect(doc.v177_auto_execution?.auto_execution).toBe("active");
      expect(doc.v177_auto_execution?.ctr_auto_fix).toBe("active");
      expect(doc.v177_auto_execution?.internal_link_auto_boost).toBe("active");
      expect(doc.v178_full_surface?.full_surface_execution).toBe("active");
      expect(doc.v178_full_surface?.tool_auto_execution).toBe("active");
      expect(doc.v178_full_surface?.answer_auto_execution).toBe("active");
      expect(doc.v178_full_surface?.core_tool_integration).toBe("active");
      expect(doc.v179_revenue?.revenue_optimization).toBe("active");
      expect(doc.v179_revenue?.upgrade_surface_control).toBe("active");
      expect(doc.v179_revenue?.revenue_path_analysis).toBe("active");
      expect(doc.v180_revenue_paywall?.revenue_attribution).toBe("active");
      expect(doc.v180_revenue_paywall?.paywall_optimization).toBe("active");
      expect(doc.v180_revenue_paywall?.payment_funnel_analysis).toBe("active");
      expect(doc.v180_revenue_paywall?.precise_revenue_attribution).toBe("active");
      expect(doc.v180_revenue_paywall?.payment_source_alignment).toBe("active");
      expect(doc.v181_revenue_growth?.revenue_driven_growth_control).toBe("active");
      expect(doc.v181_revenue_growth?.revenue_weighted_allocation).toBe("active");
      expect(doc.v181_revenue_growth?.revenue_weighted_linking).toBe("active");
      expect(doc.v181_revenue_growth?.revenue_linking_closure).toBe("active");
      expect(doc.v181_revenue_growth?.final_link_control).toBe("active");
      expect(doc.v182_revenue_amplification?.revenue_amplification_execution).toBe("active");
      expect(doc.v182_revenue_amplification?.revenue_entry_boost).toBe("active");
      expect(doc.v182_revenue_amplification?.revenue_budget_reallocation).toBe("active");
      expect(doc.v183_revenue_signal_activation?.revenue_signal_activation).toBe("active");
      expect(doc.v183_revenue_signal_activation?.exact_revenue_diagnosis).toBe("active");
      expect(doc.v184_payment_closure?.payment_closure).toBe("active");
      expect(doc.v184_payment_closure?.payment_callback_validation).toBe("active");
      expect(doc.seo_engine.length).toBeGreaterThan(0);
      expect(doc.retrieval_system.length).toBeGreaterThan(0);
      expect(doc.content_generation.length).toBeGreaterThan(0);
      expect(doc.analytics.length).toBeGreaterThan(0);
      expect(doc.monetization.length).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(tmp, "generated", "system-map.json"))).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("writeSystemMapJson: V185 active restores V182 when V183 threshold is not activated", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sys-map-v185-"));
    try {
      const gen = path.join(tmp, "generated");
      fs.mkdirSync(gen, { recursive: true });
      fs.writeFileSync(
        path.join(gen, "v183-v182-activation-threshold.json"),
        JSON.stringify({ current_status: { activated: false, exact_orders_count: 0 } }, null, 2),
        "utf8"
      );
      fs.writeFileSync(
        path.join(gen, "v185-revenue-system-state.json"),
        JSON.stringify(
          {
            v182_revenue_amplification: { state: "active" },
            current: { exact_orders_count: 1, callback_success_count: 1 }
          },
          null,
          2
        ),
        "utf8"
      );
      const doc = writeSystemMapJson(tmp, new Date("2026-03-30T10:00:00.000Z"));
      expect(doc.v182_revenue_amplification?.state).toBe("active");
      expect(doc.v182_revenue_amplification?.revenue_amplification_execution).toBe("active");
      expect(doc.v182_revenue_amplification?.revenue_entry_boost).toBe("active");
      expect(doc.v182_revenue_amplification?.revenue_budget_reallocation).toBe("active");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
