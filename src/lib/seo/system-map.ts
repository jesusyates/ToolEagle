/**
 * V169 + V170 + V171 + V172 + V173 + V174 — Static system map for operators / automation (written to generated/system-map.json).
 */

import fs from "fs";
import path from "path";

export const SYSTEM_MAP_VERSION = "185.1";

export type SystemMapModule = {
  entry_points: string[];
  scripts: string[];
  outputs: string[];
  dependencies: string[];
};

export type V171RuntimeTruth = {
  /** Rule scan + thresholds in src/config/content-quality-v171.ts + content-quality-evaluate.ts */
  content_quality_gate: "active" | "partially_active" | "placeholder" | "not_activated";
  /** Sitemap + robots + link-pool hints from generated/content-quality-status.json */
  thin_page_suppression: "active" | "partially_active" | "placeholder" | "not_activated";
  /** Tool aside + RelatedToolsCard + internal-link-priority-report.json */
  conversion_weighted_linking: "active" | "partially_active" | "placeholder" | "not_activated";
};

export type V171_1RuntimeTruth = {
  /** Heuristic scan + sitemap filter via generated/zh-content-cleanup.json */
  zh_content_cleaner: "active" | "partially_active" | "placeholder" | "not_activated";
  /** EnglishToolEntryCard on hub / category / directory */
  en_tool_entry_cards: "active" | "partially_active" | "placeholder" | "not_activated";
  /** Copy → publish modal + analytics on EN tool results */
  copy_publish_modal: "active" | "partially_active" | "placeholder" | "not_activated";
};

export type V172RuntimeTruth = {
  /** Merged retrieval + growth + tool signals → generated/high-quality-signals.json */
  high_quality_generation: "active" | "partially_active" | "placeholder" | "not_activated";
  /** Post-package + blog prompts conditioned on retrieval snippets */
  retrieval_guided_generation: "active" | "partially_active" | "placeholder" | "not_activated";
  /** Title similarity index → generated/content-deduplication.json */
  content_deduplication: "active" | "partially_active" | "placeholder" | "not_activated";
};

export type V173RuntimeTruth = {
  /** Ops JSON + JSONL rollup — generated/v173-generation-ops.json */
  production_ramp_control: "active" | "partially_active" | "placeholder" | "not_activated";
  /** Streak-based relaxed_once + v173-degradation-state.json */
  adaptive_degradation: "active" | "partially_active" | "placeholder" | "not_activated";
  /** Topic table from signals + events — generated/topic-production-control.json */
  topic_production_control: "active" | "partially_active" | "placeholder" | "not_activated";
};

export type V174RuntimeTruth = {
  /** Tiered topic frequency + daily-engine preflight — generated/v174-scale-plan.json */
  controlled_scale_execution: "active" | "partially_active" | "placeholder" | "not_activated";
  /** GSC + tools + pruning loop — generated/v174-growth-metrics.json, page-pruning-report.json */
  growth_feedback_loop: "active" | "partially_active" | "placeholder" | "not_activated";
  /** Per-path scoring — generated/page-value-score.json */
  page_value_scoring: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V175 — real GSC + conversion JSON feeding growth; stale-data guardrails. */
export type V175DataActivationTruth = {
  /** GSC JSON (search-performance.json when present) + aggregates + v174 growth metrics use real shapes */
  data_activation: "active" | "partially_active" | "placeholder" | "not_activated";
  /** generated/data-freshness.json + allocation stale multiplier */
  data_freshness_monitor: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V176 — growth execution: winners, CTR fixes, conversion amplification, link bias. */
export type V176GrowthExecutionTruth = {
  growth_execution: "active" | "partially_active" | "placeholder" | "not_activated";
  winner_amplification: "active" | "partially_active" | "placeholder" | "not_activated";
  ctr_optimization: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V177 — auto-apply MDX structure + CTR/A/B + backfill. */
export type V177AutoExecutionTruth = {
  auto_execution: "active" | "partially_active" | "placeholder" | "not_activated";
  ctr_auto_fix: "active" | "partially_active" | "placeholder" | "not_activated";
  internal_link_auto_boost: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V178 / V178.1 — full-surface manifest for EN tools + answers + core static tools (same env gate as V177). */
export type V178FullSurfaceTruth = {
  full_surface_execution: "active" | "partially_active" | "placeholder" | "not_activated";
  tool_auto_execution: "active" | "partially_active" | "placeholder" | "not_activated";
  answer_auto_execution: "active" | "partially_active" | "placeholder" | "not_activated";
  core_tool_integration: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V179 — revenue optimization: upgrade surface map, runtime boosts, dashboard (after V177 in daily-engine). */
export type V179RevenueOptimizationTruth = {
  revenue_optimization: "active" | "partially_active" | "placeholder" | "not_activated";
  upgrade_surface_control: "active" | "partially_active" | "placeholder" | "not_activated";
  revenue_path_analysis: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V180 + V180.1 — attribution from orders + payment_events + tool jsonl; paywall runtime + friction fixes. */
export type V180RevenuePaywallTruth = {
  revenue_attribution: "active" | "partially_active" | "placeholder" | "not_activated";
  paywall_optimization: "active" | "partially_active" | "placeholder" | "not_activated";
  payment_funnel_analysis: "active" | "partially_active" | "placeholder" | "not_activated";
  precise_revenue_attribution: "active" | "partially_active" | "placeholder" | "not_activated";
  payment_source_alignment: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V181 — exact revenue drives allocation, internal links, CTA runtime; repair + growth dashboard. */
export type V181RevenueGrowthTruth = {
  revenue_driven_growth_control: "active" | "partially_active" | "placeholder" | "not_activated";
  revenue_weighted_allocation: "active" | "partially_active" | "placeholder" | "not_activated";
  revenue_weighted_linking: "active" | "partially_active" | "placeholder" | "not_activated";
  /** V181.1 — V181 weights in scripts/lib/en-internal-linking.js final write path (not report-only). */
  revenue_linking_closure: "active" | "partially_active" | "placeholder" | "not_activated";
  /** V181.1 — generated/v181-final-link-control.json documents merged v176 + v181 order. */
  final_link_control: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V182 — amplify exact-revenue paths: allocation tier, entry boost, reclaim, expansion hints. */
export type V182RevenueAmplificationTruth = {
  /** V185 — from generated/v185-revenue-system-state.json when first-revenue criteria are evaluated. */
  state?: "active" | "pending";
  revenue_amplification_execution: "active" | "partially_active" | "placeholder" | "not_activated";
  revenue_entry_boost: "active" | "partially_active" | "placeholder" | "not_activated";
  revenue_budget_reallocation: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V183 — revenue signal activation diagnosis + gating for V182 amplification. */
export type V183RevenueSignalActivationTruth = {
  revenue_signal_activation: "active" | "partially_active" | "placeholder" | "not_activated";
  exact_revenue_diagnosis: "active" | "partially_active" | "placeholder" | "not_activated";
};

/** V184 — payment closure: paid orders + payment_events + webhooks. */
export type V184PaymentClosureTruth = {
  payment_closure: "active" | "partially_active" | "placeholder" | "not_activated";
  payment_callback_validation: "active" | "partially_active" | "placeholder" | "not_activated";
};

export type SystemMapJson = {
  version: string;
  updatedAt: string;
  /** V170 — single production execution entry (npm script name). */
  production_entry: string;
  /** V171 — quality / convergence (runtime truth for operators). */
  v171_convergence: V171RuntimeTruth;
  /** V171.1 — ZH locale hygiene + EN card UX + copy modal. */
  v171_1_ux: V171_1RuntimeTruth;
  /** V172 — high-quality generation layer (pregen + retrieval + dedup). */
  v172_generation: V172RuntimeTruth;
  /** V173 — production ramp: observability, degradation, topic control, cost. */
  v173_ramp: V173RuntimeTruth;
  /** V174 — controlled scale: tiered ramp, metrics, page value, pruning hints. */
  v174_scale: V174RuntimeTruth;
  /** V175 — data activation + freshness (GSC, conversion funnel, fallbacks). */
  v175_data_activation: V175DataActivationTruth;
  /** V176 — execution layer artifacts + internal-link weights. */
  v176_growth_execution: V176GrowthExecutionTruth;
  /** V177 — auto execution (MDX + logs + optional backfill). */
  v177_auto_execution: V177AutoExecutionTruth;
  /** V178 — tools + answers read v178 manifest when V177_AUTO_EXECUTION=1. */
  v178_full_surface: V178FullSurfaceTruth;
  /** V179 — upgrade runtime + revenue artifacts; UI gated with V177_AUTO_EXECUTION=1. */
  v179_revenue: V179RevenueOptimizationTruth;
  /** V180 — payment snapshot + attribution + paywall runtime (ToolPageStandardAsideLead). */
  v180_revenue_paywall: V180RevenuePaywallTruth;
  /** V181 — revenue-driven growth control (allocation + links + CTA after V180). */
  v181_revenue_growth: V181RevenueGrowthTruth;
  /** V182 — exact-revenue amplification + entry boost + resource reclaim (after V181). */
  v182_revenue_amplification: V182RevenueAmplificationTruth;
  /** V183 — exact revenue diagnosis + activation gating. */
  v183_revenue_signal_activation: V183RevenueSignalActivationTruth;
  /** V184 — create_order → callback → membership; payment_events required. */
  v184_payment_closure: V184PaymentClosureTruth;
  seo_engine: SystemMapModule[];
  retrieval_system: SystemMapModule[];
  content_generation: SystemMapModule[];
  analytics: SystemMapModule[];
  monetization: SystemMapModule[];
  notes: string[];
};

export function buildSystemMap(now = new Date()): SystemMapJson {
  return {
    version: SYSTEM_MAP_VERSION,
    updatedAt: now.toISOString(),
    production_entry: "daily-engine",
    v171_convergence: {
      content_quality_gate: "active",
      thin_page_suppression: "active",
      conversion_weighted_linking: "active"
    },
    v171_1_ux: {
      zh_content_cleaner: "active",
      en_tool_entry_cards: "active",
      copy_publish_modal: "active"
    },
    v172_generation: {
      high_quality_generation: "active",
      retrieval_guided_generation: "active",
      content_deduplication: "active"
    },
    v173_ramp: {
      production_ramp_control: "active",
      adaptive_degradation: "active",
      topic_production_control: "active"
    },
    v174_scale: {
      controlled_scale_execution: "active",
      growth_feedback_loop: "active",
      page_value_scoring: "active"
    },
    v175_data_activation: {
      data_activation: "active",
      data_freshness_monitor: "active"
    },
    v176_growth_execution: {
      growth_execution: "active",
      winner_amplification: "active",
      ctr_optimization: "active"
    },
    v177_auto_execution: {
      auto_execution: "active",
      ctr_auto_fix: "active",
      internal_link_auto_boost: "active"
    },
    v178_full_surface: {
      full_surface_execution: "active",
      tool_auto_execution: "active",
      answer_auto_execution: "active",
      core_tool_integration: "active"
    },
    v179_revenue: {
      revenue_optimization: "active",
      upgrade_surface_control: "active",
      revenue_path_analysis: "active"
    },
    v180_revenue_paywall: {
      revenue_attribution: "active",
      paywall_optimization: "active",
      payment_funnel_analysis: "active",
      precise_revenue_attribution: "active",
      payment_source_alignment: "active"
    },
    v181_revenue_growth: {
      revenue_driven_growth_control: "active",
      revenue_weighted_allocation: "active",
      revenue_weighted_linking: "active",
      revenue_linking_closure: "active",
      final_link_control: "active"
    },
    v182_revenue_amplification: {
      revenue_amplification_execution: "active",
      revenue_entry_boost: "active",
      revenue_budget_reallocation: "active"
    },
    v183_revenue_signal_activation: {
      revenue_signal_activation: "active",
      exact_revenue_diagnosis: "active"
    },
    v184_payment_closure: {
      payment_closure: "active",
      payment_callback_validation: "active"
    },
    seo_engine: [
      {
        entry_points: [
          "npm run daily-engine",
          "npm run seo:status",
          "npm run seo:daily (deprecated → proxies daily-engine)",
          "npm run seo:orchestrator (V154 sub-step / lanes)"
        ],
        scripts: [
          "scripts/daily-engine.js",
          "scripts/build-content-quality-status.ts",
          "scripts/build-internal-link-priority-report.ts",
          "scripts/build-conversion-entry-audit.ts",
          "scripts/build-zh-content-cleanup.ts",
          "scripts/build-tool-card-standardization-report.ts",
          "scripts/build-cta-standardization-report.ts",
          "scripts/build-high-quality-signals.ts",
          "scripts/build-content-deduplication.ts",
          "scripts/build-v173-production-ramp.ts",
          "scripts/build-v174-controlled-scale.ts",
          "scripts/build-v176-growth-execution.ts",
          "scripts/run-v177-auto-execution.js",
          "scripts/run-v179-revenue-optimization.js",
          "scripts/build-v180-payment-snapshot.ts",
          "scripts/run-v180-revenue-attribution.js",
          "scripts/run-v181-revenue-growth-control.js",
          "scripts/run-v182-revenue-amplification.js",
          "scripts/run-v183-revenue-signal-diagnosis.js",
          "scripts/run-v184-payment-diagnostics.js",
          "scripts/run-v185-first-revenue-acquisition.js",
          "scripts/seo-daily-proxy.js",
          "scripts/run-daily-orchestrator.ts",
          "scripts/run-background-seo-engine.ts",
          "scripts/run-seo-watchdog.ts",
          "scripts/seo-status.ts"
        ],
        outputs: [
          "logs/daily-report.json",
          "logs/daily-engine-log.jsonl",
          "logs/content-quality-decisions.jsonl",
          "generated/content-quality-status.json",
          "generated/internal-link-priority-report.json",
          "generated/conversion-entry-audit.json",
          "generated/zh-content-cleanup.json",
          "generated/tool-card-standardization-report.json",
          "generated/cta-standardization-report.json",
          "generated/high-quality-signals.json",
          "generated/content-deduplication.json",
          "generated/v173-generation-ops.json",
          "generated/v173-degradation-report.json",
          "generated/v173-degradation-state.json",
          "generated/topic-production-control.json",
          "generated/v173-ramp-allocation.json",
          "generated/v173-cost-efficiency.json",
          "logs/v173-generation-events.jsonl",
          "generated/v174-growth-metrics.json",
          "generated/page-value-score.json",
          "generated/v174-scale-plan.json",
          "generated/v174-content-expansion-hints.json",
          "generated/page-pruning-report.json",
          "generated/v174-conversion-path-optimization.json",
          "generated/data-freshness.json",
          "generated/v176-top-winners.json",
          "generated/v176-low-ctr-fix.json",
          "generated/v176-conversion-path-amplify.json",
          "generated/v176-internal-link-weights.json",
          "generated/v176-ab-test.json",
          "generated/v176-revenue-signals.json",
          "generated/v177-ctr-updates.json",
          "generated/v177-ab-selected.json",
          "generated/v177-execution-log.jsonl",
          "generated/v178-full-surface-manifest.json",
          "generated/v179-upgrade-surface-map.json",
          "generated/v179-revenue-paths.json",
          "generated/v179-revenue-dashboard.json",
          "generated/v179-low-revenue-fix.json",
          "generated/v179-upgrade-ab-test.json",
          "generated/v179-upgrade-runtime.json",
          "generated/v179-upgrade-boost-log.jsonl",
          "generated/v180-payment-db-snapshot.json",
          "generated/v180-revenue-attribution.json",
          "generated/v180-revenue-funnel.json",
          "generated/v180-paywall-friction-report.json",
          "generated/v180-paywall-ab-test.json",
          "generated/v180-revenue-dashboard.json",
          "generated/v180-paywall-runtime.json",
          "generated/v180-precise-paths.json",
          "generated/v180-paywall-optimization-log.jsonl",
          "generated/v181-revenue-growth-control.json",
          "generated/v181-revenue-link-priority.json",
          "generated/v181-revenue-cta-runtime.json",
          "generated/v181-revenue-repair-plan.json",
          "generated/v181-revenue-growth-dashboard.json",
          "generated/v181-final-link-control.json",
          "generated/v182-revenue-amplification-plan.json",
          "generated/v182-revenue-expansion-hints.json",
          "generated/v182-revenue-entry-boost.json",
          "generated/v182-revenue-resource-reclaim.json",
          "generated/v182-revenue-amplification-log.jsonl",
          "generated/v183-revenue-signal-diagnosis.json",
          "generated/v183-signal-freshness-audit.json",
          "generated/v183-exact-revenue-sample.json",
          "generated/v183-v182-activation-threshold.json",
          "generated/v184-payment-callback-diagnosis.json",
          "generated/v184-payment-test-result.json",
          "generated/v185-first-payment.json",
          "generated/v185-revenue-system-state.json",
          "generated/plausible-export.json",
          "generated/tool-usage-display.json",
          "generated/seo-pipeline-state.json",
          "generated/seo-daily-report.json",
          "generated/seo-flywheel-ramp.json",
          "generated/seo-run-heartbeat.json"
        ],
        dependencies: ["OPENAI_API_KEY or GLM", "Node 18+", "generated/* artifacts"]
      }
    ],
    retrieval_system: [
      {
        entry_points: ["npm run build-retrieval-dataset", "npm run write-retrieval-utilization-summary"],
        scripts: [
          "scripts/build-retrieval-dataset.ts",
          "scripts/write-retrieval-utilization-summary.ts",
          "scripts/lib/seo-retrieval-v153.js",
          "scripts/lib/retrieval-threshold-bias.cjs",
          "scripts/run-retrieval-optimizer.ts",
          "src/lib/seo/retrieval-optimizer.ts",
          "src/lib/seo/retrieval-activation-artifact.ts"
        ],
        outputs: [
          "generated/workflow-assets-retrieval.json",
          "generated/seo-retrieval-utilization.json",
          "generated/seo-retrieval-events.jsonl",
          "generated/seo-retrieval-activation.json",
          "generated/retrieval-optimization-plan.json"
        ],
        dependencies: ["agent_high_quality_assets.json", "RETRIEVAL_* env (optional)"]
      }
    ],
    content_generation: [
      {
        entry_points: ["npm run zh:auto", "npm run en:auto", "npm run blog:generate"],
        scripts: [
          "scripts/auto-generate-zh.js",
          "scripts/en-auto.js",
          "scripts/generate-seo-blog.js",
          "scripts/build-content-allocation-plan.js",
          "scripts/build-v174-controlled-scale.ts",
          "scripts/build-v176-growth-execution.ts",
          "scripts/run-v177-auto-execution.js",
          "scripts/run-v179-revenue-optimization.js",
          "scripts/build-v180-payment-snapshot.ts",
          "scripts/run-v180-revenue-attribution.js",
          "scripts/run-v181-revenue-growth-control.js",
          "scripts/run-v182-revenue-amplification.js",
          "scripts/run-v183-revenue-signal-diagnosis.js",
          "scripts/run-v184-payment-diagnostics.js",
          "scripts/lib/content-allocation.js"
        ],
        outputs: [
          "data/zh-keywords.json",
          "data/en-how-to-new.json",
          "content/blog/*.mdx",
          "generated/content-allocation-plan.json",
          "generated/v174-scale-plan.json",
          "generated/page-value-score.json",
          "generated/v181-revenue-growth-control.json",
          "generated/v181-final-link-control.json",
          "generated/v182-revenue-amplification-plan.json",
          "generated/v182-revenue-entry-boost.json",
          "generated/v183-revenue-signal-diagnosis.json",
          "generated/v184-payment-callback-diagnosis.json"
        ],
        dependencies: [
          "LLM API keys",
          "data/* fingerprints",
          "V181 optional — allocation uses neutral 1.0 revenue multipliers when v181-revenue-growth-control.json missing",
          "V182 optional — allocation/linking use 1.0 when v182-revenue-amplification-plan.json missing",
          "V184 — build-v180-payment-snapshot requires public.payment_events (Supabase migrations applied)"
        ]
      }
    ],
    analytics: [
      {
        entry_points: ["npm run search:growth", "npm run search:conversion"],
        scripts: ["scripts/aggregate-growth-priority.js", "scripts/aggregate-tool-conversion.js"],
        outputs: [
          "generated/growth-priority.json",
          "generated/search-performance.json",
          "generated/tool-conversion-map.json"
        ],
        dependencies: ["GSC / telemetry JSONL where configured"]
      }
    ],
    monetization: [
      {
        entry_points: ["src/app/pricing", "src/app/zh/pricing", "API /api/payment/*"],
        scripts: ["scripts/revenue-summary.js", "scripts/revenue-expand.js"],
        outputs: ["generated/revenue-expansion.json", "generated/asset-seo-revenue-summary.json"],
        dependencies: ["Supabase", "payment provider env"]
      }
    ],
    notes: [
      "V177+V178+V178.1: npm run v177:auto — run-v177-auto-execution.js applies v176 plans to EN blog MDX (sections + frontmatter/H1 for CTR), writes v177-ctr-updates, v177-ab-selected, v177-execution-log.jsonl (page_type blog|tool|answer|core_tool, action_type CTA|internal_link|workflow|CTR|v178_core_tool_surface), v178-full-surface-manifest.json (v178.1) for tool/answer/core static tool asides via ToolPageStandardAsideLead; runs backfill when fingerprints exist. Daily-engine runs V177 only when V177_AUTO_EXECUTION=1. Runtime: tools/[slug], four static tool pages, answers/[slug] read manifest only when V177_AUTO_EXECUTION=1 (dry_run ignored). Use --dry-run to preview.",
      "V179: npm run v179:revenue — run-v179-revenue-optimization.js merges v176 revenue signals, tool-conversion-map, v174 conversion-path, page-value-score, GSC, winners; writes v179-upgrade-surface-map, v179-revenue-paths, v179-revenue-dashboard, v179-low-revenue-fix, v179-upgrade-ab-test, v179-upgrade-runtime (ToolPageStandardAsideLead + AnswerUpgradePathCard when V177_AUTO_EXECUTION=1); appends v179-upgrade-boost-log.jsonl; injects structured blog MDX section for low-revenue-high-traffic slugs when V177_AUTO_EXECUTION=1 (not dry-run). Daily-engine runs V179 after V177.",
      "V180 / V180.1: npm run v180:revenue — build-v180-payment-snapshot.ts (Supabase orders + payment_events, optional) then run-v180-revenue-attribution.js writes v180-revenue-attribution (exact|inferred|fallback), v180-revenue-funnel, v180-paywall-friction-report (exact-only high-friction), v180-paywall-ab-test, v180-revenue-dashboard (top_paid_paths_exact separate from inferred), v180-precise-paths.json, v180-paywall-runtime; create-order stores attribution on orders.provider_payload; UI gated V177_AUTO_EXECUTION=1. Daily-engine runs V180 after V179.",
      "V181 / V181.1: node scripts/run-v181-revenue-growth-control.js — reads v180 exact revenue + page-value + v174 topics; writes v181-revenue-growth-control (intent/topic multipliers for content-allocation.js), v181-revenue-link-priority, v181-final-link-control.json (merged v176+v181 order for EN blog writes), v181-revenue-cta-runtime, v181-revenue-repair-plan, v181-revenue-growth-dashboard. Daily-engine runs V181 after V180, before build-content-allocation-plan. EN blog: scripts/lib/en-internal-linking.js applies loadSearchLinkPriority (v176+v181) in selectEnBlogRelatedPageSlugs, sortBlogSlugsForBacklinks, computeEnRelatedToolLinksForBlogPage — same for generate-seo-blog and backfill-en-blog-linking.",
      "V182: node scripts/run-v182-revenue-amplification.js — after V181, reads v180 precise + dashboard + v181 control/final-link; writes v182-revenue-amplification-plan (exact amplify tiers), v182-revenue-expansion-hints, v182-revenue-entry-boost, v182-revenue-resource-reclaim, v182-revenue-amplification-log.jsonl. content-allocation.js stacks V182 intent/topic multipliers after V181. en-internal-linking.js loadSearchLinkPriority adds v182 for blog related scoring + related-tools order. ToolPageStandardAsideLead + answers/[slug] merge v182 placement tools. Daily-engine runs V182 after V181, before build-content-allocation-plan.",
      "V184: Supabase migration 0037_v184_payment_events_closure.sql ensures public.payment_events exists; build-v180-payment-snapshot.ts exits non-zero if payment_events cannot be queried. Global Lemon: create-order appends checkout[custom][merchant_order_id] to NEXT_PUBLIC_PAYMENT_LINK; POST /api/payment/lemon-webhook verifies LEMON_SQUEEZY_SIGNING_SECRET, marks orders paid, writes payment_events, activates credits. CN aggregator: POST /api/payment/callback unchanged signature flow. run-v184-payment-diagnostics.js writes v184-payment-callback-diagnosis.json + v184-payment-test-result.json. Daily-engine runs V184 diagnostics after V183.",
      "V185: node scripts/run-v185-first-revenue-acquisition.js — optional npm run v184:verify; writes v185-first-payment.json + v185-revenue-system-state.json (v182_revenue_amplification.state active when exact_orders_count>=1 and callback_success>=1). Daily-engine runs with --skip-verify after V184. writeSystemMapJson merges v185: when state is active, V182 runtime flags are forced active (overrides V183 placeholder until threshold file catches up).",
      "V176: npm run v176:execution — build-v176-growth-execution.ts writes v176-internal-link-weights; consumed by scripts/lib/en-internal-linking.js after search/growth sets, before V181 revenue layer; also v176-top-winners, v176-low-ctr-fix, v176-conversion-path-amplify, v176-ab-test, v176-revenue-signals.",
      "V175: data activation — daily-engine runs search:conversion → search:growth (search-performance.json is optional legacy input, no longer auto-pulled); aggregate-tool-conversion merges funnel_totals + tool-output-actions; build-v174 writes data-freshness.json; stale_data applies allocation multiplier via data-freshness.json.",
      "V174: npm run v174:scale — build-v174-controlled-scale.ts writes v174-growth-metrics, page-value-score, v174-scale-plan (HIGH_PERFORMING/STABLE/RISKY), expansion hints, pruning report, conversion-path optimization; daily-engine runs search:growth + V172/V173 + V174 before content-allocation-plan so blog generation uses tiered weights; content-allocation multiplies V173 then V174 topicFrequencyMultipliers.",
      "V173: npm run v173:ramp — rolls up logs/v173-generation-events.jsonl + degradation state into v173-*.json + topic-production-control.json; content-allocation applies v173-ramp-allocation topicTailMultipliers; API adaptive relaxed_once after V173_RELAX_STREAK_THRESHOLD strict failures (default 3).",
      "V172: npm run v172:artifacts — high-quality-signals.json (retrieval + growth + tool-output-quality) + content-deduplication.json; generate-package + blog:generate inject retrieval into prompts; pregen/dedup gates; strict mode when high-quality-signals.json exists (TOOLEAGLE_V172_LEGACY_FALLBACK=1 restores heuristic packages).",
      "V171.1: npm run v171.1:artifacts — zh-content-cleanup.json, tool-card-standardization-report.json; EN tool listings use EnglishToolEntryCard; copy→publish modal on EN tools.",
      "V171.2: content-quality gate active — build-content-quality-status.ts enumerates ideas/answers/captions/hooks/captions-for/expansion/seo-grid; internalLinkExcludePaths (hard) replaces linkPoolSoft; cta-standardization-report.json; daily-engine runs quality + link report after EN/ZH generate, before internal linking.",
      "V170 production entry: npm run daily-engine only; seo:daily proxies with deprecation warning; seo:orchestrator for V154 lanes/debug.",
      "Canonical daily report: logs/daily-report.json (generated/seo-daily-report.json when orchestrator runs alone).",
      "V168 retrieval-optimization-plan.json feeds env_suggestions consumed on next daily-engine run.",
      "This file is regenerated by seo:status and daily-engine; safe to treat as documentation, not auth."
    ]
  };
}

export function writeSystemMapJson(cwd: string, now = new Date()): SystemMapJson {
  const doc = buildSystemMap(now);

  // V183 gating: when activation thresholds are not met, V182 must not look "already amplified".
  // Tests may call writeSystemMapJson without generated/v183 artifacts; in that case we keep V182 as active.
  try {
    const thPath = path.join(cwd, "generated", "v183-v182-activation-threshold.json");
    if (fs.existsSync(thPath)) {
      const th = JSON.parse(fs.readFileSync(thPath, "utf8"));
      const activated = Boolean(th?.current_status?.activated);
      if (!activated) {
        doc.v182_revenue_amplification.revenue_amplification_execution = "placeholder";
        doc.v182_revenue_amplification.revenue_entry_boost = "placeholder";
        doc.v182_revenue_amplification.revenue_budget_reallocation = "placeholder";
      }
      if (typeof th?.current_status === "object") {
        doc.v183_revenue_signal_activation.revenue_signal_activation = "active";
        doc.v183_revenue_signal_activation.exact_revenue_diagnosis = "active";
      }
    }
  } catch {
    // non-fatal: system-map is still documentation
  }

  // V185 first revenue: when v185-revenue-system-state marks V182 active, restore flags (overrides V183 placeholder).
  try {
    const v185Path = path.join(cwd, "generated", "v185-revenue-system-state.json");
    if (fs.existsSync(v185Path)) {
      const v185 = JSON.parse(fs.readFileSync(v185Path, "utf8"));
      const st = v185?.v182_revenue_amplification?.state;
      if (st === "active") {
        doc.v182_revenue_amplification.revenue_amplification_execution = "active";
        doc.v182_revenue_amplification.revenue_entry_boost = "active";
        doc.v182_revenue_amplification.revenue_budget_reallocation = "active";
      }
      if (st === "active" || st === "pending") {
        doc.v182_revenue_amplification.state = st;
      }
    }
  } catch {
    // non-fatal
  }

  const p = path.join(cwd, "generated", "system-map.json");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(doc, null, 2), "utf8");
  return doc;
}
