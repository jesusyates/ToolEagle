/**
 * V136 structured logs for asset-backed SEO (reuse pattern: console JSON line).
 * Never log raw user prompts or full captions — metadata only.
 */

export type AssetSeoTelemetryInput = {
  asset_id: string;
  seo_candidate_selected: boolean;
  seo_candidate_reason: string;
  seo_page_type: string;
  seo_queue_rank: number;
  seo_publish_status: string;
  source_quality_tier: string;
  source_promotion_status: string;
  source_retrieval_rank_weight: number;
};

export function logAssetSeoPipeline(input: AssetSeoTelemetryInput): void {
  try {
    console.info(
      "[asset_seo_pipeline]",
      JSON.stringify({
        ts: new Date().toISOString(),
        asset_id: input.asset_id,
        seo_candidate_selected: input.seo_candidate_selected,
        seo_candidate_reason: input.seo_candidate_reason,
        seo_page_type: input.seo_page_type,
        seo_queue_rank: input.seo_queue_rank,
        seo_publish_status: input.seo_publish_status,
        source_quality_tier: input.source_quality_tier,
        source_promotion_status: input.source_promotion_status,
        source_retrieval_rank_weight: input.source_retrieval_rank_weight
      })
    );
  } catch {
    // no-op
  }
}

export type AssetSeoFeedbackTelemetryInput = {
  seo_feedback_imported: boolean;
  seo_effectiveness_score: number;
  seo_success_state: string;
  matched_by_url: boolean;
  matched_by_slug: boolean;
  asset_feedback_refreshed: boolean;
  queue_feedback_bonus_applied: boolean;
  exploration_slot_used: boolean;
};

export function logAssetSeoFeedback(input: AssetSeoFeedbackTelemetryInput): void {
  try {
    console.info(
      "[asset_seo_feedback]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

/** V138 materialization / manifest (metadata only; no raw content). */
export type AssetSeoMaterializationTelemetryInput = {
  asset_seo_materialization_attempted: boolean;
  asset_seo_materialization_succeeded: boolean;
  asset_seo_materialization_failed: boolean;
  asset_seo_materialization_skipped: boolean;
  asset_seo_manifest_written: boolean;
  source_lane: string;
  page_type: string;
  workflow_id: string;
  manifest_id: string;
  sitemap_handoff_status: string;
  internal_link_handoff_status: string;
  seo_page_id: string;
};

export function logAssetSeoMaterialization(input: AssetSeoMaterializationTelemetryInput): void {
  try {
    console.info(
      "[asset_seo_materialization]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoManifestWritten(params: {
  manifest_id: string;
  path: string;
  total_attempted: number;
  source_lane: string;
}): void {
  try {
    console.info(
      "[asset_seo_manifest]",
      JSON.stringify({
        ts: new Date().toISOString(),
        asset_seo_manifest_written: true,
        manifest_id: params.manifest_id,
        path: params.path,
        total_attempted: params.total_attempted,
        source_lane: params.source_lane
      })
    );
  } catch {
    // no-op
  }
}

/** V139 activation (metadata only). */
export type AssetSeoActivationTelemetryInput = {
  asset_seo_activation_attempted: boolean;
  asset_seo_activation_succeeded: boolean;
  asset_seo_activation_partial: boolean;
  asset_seo_activation_failed: boolean;
  sitemap_handoff_succeeded: boolean;
  internal_link_handoff_succeeded: boolean;
  indexing_handoff_queued: boolean;
  activation_manifest_written: boolean;
  activation_manifest_id: string;
  source_lane: string;
  page_type: string;
  workflow_id: string;
  seo_page_id: string;
};

export function logAssetSeoActivation(input: AssetSeoActivationTelemetryInput): void {
  try {
    console.info(
      "[asset_seo_activation]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoActivationManifestWritten(params: {
  manifest_id: string;
  path: string;
  total_attempted: number;
}): void {
  try {
    console.info(
      "[asset_seo_activation_manifest]",
      JSON.stringify({
        ts: new Date().toISOString(),
        activation_manifest_written: true,
        activation_manifest_id: params.manifest_id,
        path: params.path,
        total_attempted: params.total_attempted
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoAutopilot(input: {
  event:
    | "asset_seo_autopilot_started"
    | "asset_seo_autopilot_stage_completed"
    | "asset_seo_autopilot_stage_failed"
    | "asset_seo_autopilot_throttle_applied"
    | "asset_seo_autopilot_completed";
  run_id: string;
  lane: string;
  run_mode: string;
  stage?: string;
  counts?: Record<string, unknown>;
  overall_status?: string;
  throttle_action?: string;
  throttle_reason?: string | null;
}): void {
  try {
    console.info(
      "[asset_seo_autopilot]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoVolumePolicy(input: {
  event:
    | "asset_seo_volume_policy_computed"
    | "topic_allocation_decided"
    | "publish_limit_adjusted"
    | "exploration_ratio_changed";
  lane: string;
  run_id?: string;
  daily_publish_limit?: number;
  exploration_ratio?: number;
  exploitation_ratio?: number;
  topic_allocation_count?: number;
  platform_allocation_count?: number;
  reason?: string | null;
}): void {
  try {
    console.info(
      "[asset_seo_volume_policy]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoScaling(input: {
  event:
    | "asset_seo_scaling_mode_selected"
    | "scaling_upshift"
    | "scaling_downshift"
    | "topic_boost_applied"
    | "safety_guard_triggered";
  lane: string;
  run_id?: string;
  scaling_mode?: string;
  multiplier?: number;
  boosted_topics?: string[];
  suppressed_topics?: string[];
  reason?: string | null;
}): void {
  try {
    console.info(
      "[asset_seo_scaling]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoCitation(input: {
  event: "asset_seo_citation_scored" | "asset_seo_citation_bonus_applied" | "citation_ready_page_emitted";
  citation_score: number;
  citation_tier: string;
  citation_ready: boolean;
  page_type: string;
  workflow_id: string;
  normalized_topic: string;
  seo_page_id?: string;
  bonus_points?: number;
}): void {
  try {
    console.info(
      "[asset_seo_citation]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoCitationAmplification(input: {
  event: "citation_pattern_applied" | "citation_v2_scored" | "ai_selection_simulated" | "brand_embedding_inserted";
  page_type: string;
  workflow_id: string;
  normalized_topic: string;
  citation_score?: number;
  citation_score_v2?: number;
  selection_score?: number;
  pattern_usage_applied?: boolean;
  brand_embedding_inserted?: boolean;
}): void {
  try {
    console.info(
      "[asset_seo_citation_amp]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoAiCapture(input: {
  event: "ai_capture_scored" | "ai_capture_cta_emitted" | "ai_capture_bonus_applied" | "ai_capture_intent_assigned";
  ai_capture_ready: boolean;
  ai_intent_type?: string | null;
  primary_cta_type?: string | null;
  secondary_cta_type?: string | null;
  page_type: string;
  workflow_id: string;
  normalized_topic: string;
  bonus_points?: number;
}): void {
  try {
    console.info(
      "[asset_seo_ai_capture]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoConversionPath(input: {
  event: "conversion_path_scored" | "conversion_path_emitted" | "conversion_bonus_applied";
  conversion_path_ready: boolean;
  primary_conversion_target?: string | null;
  secondary_conversion_target?: string | null;
  page_type: string;
  workflow_id: string;
  normalized_topic: string;
  bonus_points?: number;
  /** V158 — bounded amplification metadata */
  exposure_multiplier?: number;
  cta_frequency_cap?: number;
  revenue_tier?: string;
}): void {
  try {
    console.info(
      "[asset_seo_conversion_path]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoConversionFeedback(input: {
  event: "conversion_score_computed" | "queue_conversion_boost_applied" | "cta_variant_selected";
  normalized_topic: string;
  workflow_id: string;
  page_type: string;
  conversion_score?: number;
  conversion_tier?: "high" | "medium" | "low";
  conversion_bonus?: number;
  cta_variant?: string;
}): void {
  try {
    console.info(
      "[asset_seo_conversion_feedback]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoDataFlywheel(input: {
  event:
    | "high_quality_asset_saved"
    | "retrieval_used_for_generation"
    | "topic_expansion_generated"
    | "data_flywheel_metrics_computed"
    | "retrieval_share_updated"
    | "high_quality_yield_computed"
    | "cost_shift_proxy_updated";
  asset_id?: string;
  normalized_topic?: string;
  workflow_id?: string;
  page_type?: string;
  retrieval_count?: number;
  high_quality_retrieval_count?: number;
  expansion_count?: number;
}): void {
  try {
    console.info(
      "[asset_seo_data_flywheel]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

/** V153 — generation path + cost tier (metadata only). */
export function logV153SeoGeneration(input: {
  retrieval_used: boolean;
  generation_mode: "retrieval" | "ai";
  model_cost_tier: "low" | "medium" | "high";
  slug?: string;
  keyword?: string;
}): void {
  try {
    console.info(
      "[v153_seo_gen]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logV153RetrievalPathUsed(input: Record<string, unknown>): void {
  try {
    console.info("[v153_retrieval_path]", JSON.stringify({ ts: new Date().toISOString(), event: "retrieval_path_used", ...input }));
  } catch {
    // no-op
  }
}

export function logV153AiFallbackUsed(input: Record<string, unknown>): void {
  try {
    console.info("[v153_ai_fallback]", JSON.stringify({ ts: new Date().toISOString(), event: "ai_fallback_used", ...input }));
  } catch {
    // no-op
  }
}

export function logV153CostOptimizationApplied(input: Record<string, unknown>): void {
  try {
    console.info("[v153_cost_optimization]", JSON.stringify({ ts: new Date().toISOString(), event: "cost_optimization_applied", ...input }));
  } catch {
    // no-op
  }
}

/** V166 — mirrors JSONL in `generated/seo-retrieval-events.jsonl` (metadata only). */
export function logRetrievalHitRecorded(input: Record<string, unknown>): void {
  try {
    console.info(
      "[retrieval_telemetry]",
      JSON.stringify({ ts: new Date().toISOString(), event: "retrieval_hit_recorded", ...input })
    );
  } catch {
    // no-op
  }
}

export function logRetrievalFallbackReasonRecorded(input: Record<string, unknown>): void {
  try {
    console.info(
      "[retrieval_telemetry]",
      JSON.stringify({ ts: new Date().toISOString(), event: "retrieval_fallback_reason_recorded", ...input })
    );
  } catch {
    // no-op
  }
}

export function logRetrievalBiasApplied(input: Record<string, unknown>): void {
  try {
    console.info(
      "[retrieval_telemetry]",
      JSON.stringify({ ts: new Date().toISOString(), event: "retrieval_bias_applied", ...input })
    );
  } catch {
    // no-op
  }
}

/** V160 — AI citation dominance loop (metadata only; no external citation APIs). */
export function logAssetSeoAiCitationDominance(input: {
  event: "ai_citation_dominance_computed" | "ai_citable_topic_boosted" | "weak_ai_topic_suppressed";
  overall_ai_citation_score?: number;
  row_count?: number;
  top_topics_sample?: string[];
  weak_topics_sample?: string[];
  topic_key?: string;
  bonus_delta?: number;
  penalty_delta?: number;
  reason?: string;
}): void {
  try {
    console.info(
      "[asset_seo_ai_citation_dominance]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

/** V163 — intent escalation (metadata only). */
export function logAssetSeoIntentEscalation(input: {
  event:
    | "intent_state_detected"
    | "intent_escalation_applied"
    | "high_intent_escalated"
    | "monetization_ready_detected";
  current_intent_state?: string;
  next_intent_state?: string;
  recommended_nudge?: string;
  escalation_strength?: number;
  topic_key?: string;
  workflow_id?: string;
  row_count?: number;
  reason?: string;
}): void {
  try {
    console.info(
      "[asset_seo_intent_escalation]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

/** V162 — segment strategy (metadata only). */
export function logAssetSeoSegmentStrategy(input: {
  event:
    | "segment_strategy_computed"
    | "high_value_segment_prioritized"
    | "low_value_segment_deprioritized";
  segment_key?: string;
  topic_key?: string;
  queue_bonus_delta?: number;
  recommended_allocation_weight?: number;
  row_count?: number;
  reason?: string;
}): void {
  try {
    console.info(
      "[asset_seo_segment_strategy]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

/** V161 — bounded traffic allocation (metadata only). */
export function logAssetSeoTrafficAllocation(input: {
  event:
    | "traffic_allocation_computed"
    | "high_value_segment_allocated"
    | "low_value_segment_suppressed"
    | "exploration_quota_assigned";
  topic_key?: string;
  workflow_id?: string;
  page_type?: string;
  total_daily_capacity?: number;
  suppressed_count?: number;
  exploration_quota_count?: number;
  allocation_bonus?: number;
  recommended_zh_batch_scale?: number;
  recommended_en_batch_scale?: number;
  reason?: string;
}): void {
  try {
    console.info(
      "[asset_seo_traffic_allocation]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

/** V158 — revenue scaling signals (metadata only). */
export function logAssetSeoRevenueScaling(input: {
  event: "revenue_signal_detected" | "high_value_topic_boosted" | "low_value_topic_suppressed";
  topic_key?: string;
  workflow_id?: string;
  revenue_score?: number;
  bonus_delta?: number;
  penalty_delta?: number;
  reason?: string;
}): void {
  try {
    console.info(
      "[asset_seo_revenue_scaling]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}

export function logAssetSeoMonetization(input: {
  event:
    | "monetization_trigger_fired"
    | "upgrade_clicked"
    | "conversion_completed"
    | "monetization_variant_assigned"
    | "monetization_variant_winner_selected"
    | "trigger_timing_optimized"
    | "monetization_global_winner_applied"
    | "monetization_topic_strategy_applied"
    | "monetization_workflow_strategy_applied"
    | "monetization_server_timing_applied"
    | "monetization_intelligence_computed";
  workflow_id?: string;
  normalized_topic?: string;
  trigger_type?: "none" | "soft" | "hard";
  trigger_position?: "post_generate" | "mid_generate" | "repeat_use";
  revenue_proxy?: number;
  variant_id?: string;
  best_trigger_timing?: number;
}): void {
  try {
    console.info(
      "[asset_seo_monetization]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ...input
      })
    );
  } catch {
    // no-op
  }
}
