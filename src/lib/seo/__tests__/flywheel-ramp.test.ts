import {
  ASSET_POOL_READY_THRESHOLD,
  computeFlywheelFlags,
  computeRetrievalAndAiShare,
  computeSeoFlywheelRampArtifact,
  daysSinceActivation
} from "@/lib/seo/flywheel-ramp";

const DS_TH = 3;

describe("flywheel-ramp", () => {
  const now = new Date("2026-03-29T12:00:00.000Z");

  it("computeRetrievalAndAiShare splits totals", () => {
    expect(computeRetrievalAndAiShare(3, 7)).toEqual({ retrieval_share: 0.3, ai_share: 0.7 });
  });

  it("computeRetrievalAndAiShare returns zeros for empty", () => {
    expect(computeRetrievalAndAiShare(0, 0)).toEqual({ retrieval_share: 0, ai_share: 0 });
  });

  it("asset_pool_ready when HQ above threshold", () => {
    const f = computeFlywheelFlags({
      hqAssetCount: ASSET_POOL_READY_THRESHOLD + 1,
      retrieval_share: 0,
      retrievalCount: 0,
      previousRetrievalShare: null,
      retrievalDatasetCount: 0,
      retrievalDatasetThreshold: DS_TH
    });
    expect(f.asset_pool_ready).toBe(true);
    expect(f.flywheel_active).toBe(false);
    expect(f.retrieval_dataset_ready).toBe(false);
    expect(f.retrieval_ready).toBe(false);
  });

  it("retrieval_ramping only when share rises vs previous", () => {
    expect(
      computeFlywheelFlags({
        hqAssetCount: 10,
        retrieval_share: 0.4,
        retrievalCount: 4,
        previousRetrievalShare: null,
        retrievalDatasetCount: DS_TH,
        retrievalDatasetThreshold: DS_TH
      }).retrieval_ramping
    ).toBe(false);
    expect(
      computeFlywheelFlags({
        hqAssetCount: 10,
        retrieval_share: 0.4,
        retrievalCount: 4,
        previousRetrievalShare: 0.2,
        retrievalDatasetCount: DS_TH,
        retrievalDatasetThreshold: DS_TH
      }).retrieval_ramping
    ).toBe(true);
  });

  it("flywheel_active when HQ and retrieval usage visible", () => {
    const f = computeFlywheelFlags({
      hqAssetCount: 5,
      retrieval_share: 0.1,
      retrievalCount: 1,
      previousRetrievalShare: 0,
      retrievalDatasetCount: DS_TH,
      retrievalDatasetThreshold: DS_TH
    });
    expect(f.flywheel_active).toBe(true);
    expect(f.flywheel_state).toBe("active");
  });

  it("retrieval_ready and dataset_ready when dataset meets threshold", () => {
    const f = computeFlywheelFlags({
      hqAssetCount: 1,
      retrieval_share: 0,
      retrievalCount: 0,
      previousRetrievalShare: null,
      retrievalDatasetCount: 4,
      retrievalDatasetThreshold: DS_TH
    });
    expect(f.retrieval_dataset_ready).toBe(true);
    expect(f.retrieval_ready).toBe(true);
  });

  it("computeSeoFlywheelRampArtifact shapes output and V165 fields", () => {
    const a = computeSeoFlywheelRampArtifact(
      {
        hqAssetCount: 3,
        retrievalDatasetCount: 2,
        retrievalDatasetLastBuiltAt: "2026-03-29T10:00:00.000Z",
        retrievalDatasetThreshold: DS_TH,
        retrievalCount: 1,
        aiGenerationCount: 3,
        previousRetrievalShare: 0.1,
        activationIso: "2026-03-28T00:00:00.000Z",
        now
      },
      null
    );
    expect(a.current_high_quality_asset_count).toBe(3);
    expect(a.current_retrieval_dataset_count).toBe(2);
    expect(a.retrieval_share).toBe(0.25);
    expect(a.ai_share).toBe(0.75);
    expect(a.days_since_activation).toBe(1);
    expect(a.retrieval_dataset_ready).toBe(false);
    expect(a.retrieval_ready).toBe(false);
    expect(a.retrieval_dataset_threshold).toBe(DS_TH);
    expect(a.retrieval_dataset_last_built_at).toBe("2026-03-29T10:00:00.000Z");
    expect(a.retrieval_hits_window).toBe(0);
    expect(a.retrieval_fallbacks_window).toBe(0);
    expect(a.fallback_top_reason).toBeNull();
    expect(a.top_retrieval_topic_sample).toBeNull();
    expect(typeof a.notes).toBe("string");
  });

  it("computeSeoFlywheelRampArtifact marks dataset ready when count >= threshold", () => {
    const a = computeSeoFlywheelRampArtifact(
      {
        hqAssetCount: 5,
        retrievalDatasetCount: 5,
        retrievalDatasetLastBuiltAt: "2026-03-29T11:00:00.000Z",
        retrievalDatasetThreshold: DS_TH,
        retrievalCount: 0,
        aiGenerationCount: 1,
        previousRetrievalShare: null,
        activationIso: "2026-03-28T00:00:00.000Z",
        now,
        utilizationWindow: {
          retrieval_hits_window: 4,
          retrieval_fallbacks_window: 1,
          fallback_top_reason: "score_below_threshold",
          top_retrieval_topic_sample: "tiktok"
        }
      },
      null
    );
    expect(a.retrieval_dataset_ready).toBe(true);
    expect(a.retrieval_ready).toBe(true);
    expect(a.flywheel_state).toBe("warming");
    expect(a.retrieval_hits_window).toBe(4);
    expect(a.fallback_top_reason).toBe("score_below_threshold");
    expect(a.top_retrieval_topic_sample).toBe("tiktok");
  });

  it("daysSinceActivation returns null for missing iso", () => {
    expect(daysSinceActivation(null, now)).toBeNull();
  });
});
