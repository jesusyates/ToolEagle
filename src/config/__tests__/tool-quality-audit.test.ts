import { generators } from "@/config/generators";
import { tools } from "@/config/tools";
import { generateHashtagTemplate } from "@/lib/generators/fallback/hashtagTemplate";
import { generateTitleTemplate } from "@/lib/generators/fallback/titleTemplate";
import { auditToolGenerator, type ToolGenerateConfig } from "@/lib/tool-quality-audit";

/** Custom-route tools: same local `generate` as page clients (template fallback). */
const EXTRA_FALLBACK_AUDITS: Record<string, ToolGenerateConfig> = {
  "hashtag-generator": { generate: generateHashtagTemplate },
  "title-generator": { generate: generateTitleTemplate }
};

describe("tool quality audit", () => {
  it("every generator slug is registered in tools.ts", () => {
    const toolSlugs = new Set(tools.map((t) => t.slug));
    const missing = Object.keys(generators).filter((s) => !toolSlugs.has(s));
    expect(missing).toEqual([]);
  });

  it("every audited fallback slug is registered in tools.ts", () => {
    const toolSlugs = new Set(tools.map((t) => t.slug));
    for (const slug of Object.keys(EXTRA_FALLBACK_AUDITS)) {
      expect(toolSlugs.has(slug)).toBe(true);
    }
  });

  it("local generators pass relevance, variation, and safety checks (no numeric score)", () => {
    const violations: { slug: string; type: string; detail: string }[] = [];

    for (const slug of Object.keys(generators)) {
      violations.push(...auditToolGenerator(slug, generators[slug]));
    }
    for (const slug of Object.keys(EXTRA_FALLBACK_AUDITS)) {
      violations.push(...auditToolGenerator(slug, EXTRA_FALLBACK_AUDITS[slug]));
    }

    if (violations.length > 0) {
      const preview = violations
        .slice(0, 30)
        .map((v) => `- [${v.type}] ${v.slug}: ${v.detail}`)
        .join("\n");
      throw new Error(
        `tool-quality-audit failed: ${violations.length} issue(s)\npreview:\n${preview}`
      );
    }
  });
});
