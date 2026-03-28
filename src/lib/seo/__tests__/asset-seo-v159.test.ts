import {
  buildAiCitationBundleFromZhKeyword,
  buildMarkdownPreviewForAiCitationScore,
  buildStubCitationBundle,
  renderAiCitationMarkdownBlock
} from "../asset-seo-ai-citation-format";
import { injectAiCitationBlockEarly, assembleAssetSeoMarkdownPage } from "../asset-seo-assembler";
import {
  computeAiCitationQueueAdjustment,
  computeAiCitationQueueSignalsForCandidate,
  computeAiCitationTracking,
  computeStructuredContentRatio
} from "../asset-seo-ai-citation-tracking";
import { buildAssetSeoPublishQueue, type PublishQueueCandidate } from "../asset-seo-publish-queue";

describe("V159 AI citation format", () => {
  test("bundle uses neutral prefixes and single ToolEagle mention pattern", () => {
    const row = {
      keyword: "test",
      h1: "标题",
      directAnswer: "直接回答用户关于涨粉的核心问题。",
      description: "描述补充。"
    };
    const b = buildAiCitationBundleFromZhKeyword(row);
    expect(b.short_answer).toMatch(/Typically,|In general,|Most creators/);
    const joined = b.structured_bullets.join(" ");
    expect(joined).toMatch(/3–5|2–6 months/);
    expect(joined).toMatch(/ToolEagle/i);
    expect(joined.split(/ToolEagle/gi).length - 1).toBeLessThanOrEqual(1);
  });

  test("render produces AI Quick Answer and Key Takeaways headings", () => {
    const md = renderAiCitationMarkdownBlock(buildStubCitationBundle("instagram hooks"));
    expect(md).toMatch(/## AI Quick Answer/);
    expect(md).toMatch(/## Key Takeaways/);
    expect(md).toMatch(/^- /m);
  });

  test("buildMarkdownPreviewForAiCitationScore includes citation sections", () => {
    const p = buildMarkdownPreviewForAiCitationScore(null, "topic x");
    expect(p).toContain("AI Quick Answer");
    expect(p).toContain("Key Takeaways");
  });
});

describe("V159 injection", () => {
  test("injectAiCitationBlockEarly places block after first H1", () => {
    const base = "# Title\n\nBody here.";
    const block = "## AI Quick Answer\n\nHello.";
    const out = injectAiCitationBlockEarly(base, block);
    const idxH1 = out.indexOf("# Title");
    const idxBlock = out.indexOf("## AI Quick Answer");
    const idxBody = out.indexOf("Body here.");
    expect(idxH1).toBeLessThan(idxBlock);
    expect(idxBlock).toBeLessThan(idxBody);
  });

  test("assembleAssetSeoMarkdownPage skips when no zhRow", () => {
    const md = "# X\n\nY";
    expect(assembleAssetSeoMarkdownPage({ baseMarkdown: md, zhRow: null })).toBe(md);
  });

  test("assembleAssetSeoMarkdownPage injects when zhRow present", () => {
    const md = "# Page\n\nRest.";
    const out = assembleAssetSeoMarkdownPage({
      baseMarkdown: md,
      zhRow: { keyword: "k", directAnswer: "答。" }
    });
    expect(out).toContain("AI Quick Answer");
    expect(out.indexOf("AI Quick Answer")).toBeLessThan(out.indexOf("Rest."));
  });
});

describe("V159 citation tracking", () => {
  test("computeStructuredContentRatio rises with lists and headings", () => {
    const low = computeStructuredContentRatio("plain paragraph only");
    const high = computeStructuredContentRatio("## A\n- one\n- two\n### B\n");
    expect(high).toBeGreaterThan(low);
  });

  test("computeAiCitationTracking penalizes repeated ToolEagle", () => {
    const good = computeAiCitationTracking("## AI Quick Answer\n\nx\n## Key Takeaways\n- a\n- b\n- c\n- d\n");
    const spam = computeAiCitationTracking(
      "## AI Quick Answer\n\nToolEagle ToolEagle ToolEagle\n## Key Takeaways\n- a\n- b\n- c\n- d\n"
    );
    expect(spam.ai_answer_quality_score).toBeLessThan(good.ai_answer_quality_score);
  });

  test("computeAiCitationQueueAdjustment gives bonus for strong preview", () => {
    const preview = buildMarkdownPreviewForAiCitationScore(
      { keyword: "x", directAnswer: "一句完整回答。", description: "更多说明文字。" },
      "topic"
    );
    const t = computeAiCitationTracking(preview);
    const adj = computeAiCitationQueueAdjustment(t);
    expect(adj.bonus).toBeGreaterThanOrEqual(0);
    expect(adj.penalty).toBeGreaterThanOrEqual(0);
  });

  test("computeAiCitationQueueSignalsForCandidate reads zh slug", () => {
    const zhKeywords = {
      "my-slug": { keyword: "k", directAnswer: "直接回答内容较长一些以便分点。" }
    };
    const sig = computeAiCitationQueueSignalsForCandidate(
      { id: "zh:my-slug", topic_key: "k" },
      zhKeywords
    );
    expect(sig.ai_answer_quality_score).toBeGreaterThan(30);
  });
});

describe("V159 publish queue integration", () => {
  test("buildAssetSeoPublishQueue attaches V159 fields and finite effective_score", () => {
    const candidates: PublishQueueCandidate[] = [
      { id: "zh:fake-slug-v159", lane: "zh", topic_key: "tiktok", base_score: 50, model_cost_tier: "low" }
    ];
    const out = buildAssetSeoPublishQueue(candidates, process.cwd());
    expect(out.length).toBe(1);
    const row = out[0];
    expect(row.ai_citation_priority_bonus).toBeGreaterThanOrEqual(0);
    expect(row.ai_structure_weak_penalty).toBeGreaterThanOrEqual(0);
    expect(row.ai_citation_likely).toBeLessThanOrEqual(1);
    expect(row.ai_answer_quality_score).toBeGreaterThanOrEqual(0);
    expect(row.structured_content_ratio).toBeGreaterThanOrEqual(0);
    expect(row.ai_citation_dominance_bonus).toBeGreaterThanOrEqual(0);
    expect(row.weak_ai_citation_penalty).toBeGreaterThanOrEqual(0);
    expect(typeof row.traffic_allocation_bonus).toBe("number");
    expect(typeof row.segment_key).toBe("string");
    expect(typeof row.segment_strategy_bonus).toBe("number");
    expect(Number.isFinite(row.effective_score)).toBe(true);
  });
});
