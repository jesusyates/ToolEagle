import {
  seoPageEntries,
  getSeoPageEntry,
  getSeoPageParams,
  formatTopicLabel,
  getExamplesForTopic,
  getCategoryLabel,
  getRelatedBlogSlugs,
  getRelatedSeoPages,
  getWritingTips
} from "../seo-pages";
import { tools } from "../tools";

describe("seo-pages config", () => {
  it("has 200-300 entries", () => {
    expect(seoPageEntries.length).toBeGreaterThanOrEqual(200);
    expect(seoPageEntries.length).toBeLessThanOrEqual(350);
  });

  it("each entry has valid category, topic, tool", () => {
    const validCategories = ["tiktok", "youtube", "instagram"];
    seoPageEntries.forEach((entry) => {
      expect(validCategories).toContain(entry.category);
      expect(typeof entry.topic).toBe("string");
      expect(entry.topic.length).toBeGreaterThan(0);
      const tool = tools.find((t) => t.slug === entry.tool);
      expect(tool).toBeDefined();
    });
  });

  it("getSeoPageEntry returns correct entry", () => {
    const entry = getSeoPageEntry("tiktok", "funny-captions");
    expect(entry?.category).toBe("tiktok");
    expect(entry?.topic).toBe("funny-captions");
    expect(entry?.tool).toBe("tiktok-caption-generator");
  });

  it("getSeoPageParams returns all params for generateStaticParams", () => {
    const params = getSeoPageParams();
    expect(params.length).toBe(seoPageEntries.length);
    params.forEach(({ category, topic }) => {
      expect(getSeoPageEntry(category, topic)).toBeDefined();
    });
  });

  it("formatTopicLabel formats slug to title case", () => {
    expect(formatTopicLabel("funny-captions")).toBe("Funny Captions");
    expect(formatTopicLabel("video-ideas")).toBe("Video Ideas");
  });

  it("getExamplesForTopic returns array", () => {
    expect(getExamplesForTopic("funny-captions")).toHaveLength(5);
    expect(getExamplesForTopic("unknown-topic", "tiktok")).toEqual(
      expect.any(Array)
    );
  });

  it("getCategoryLabel returns platform name", () => {
    expect(getCategoryLabel("tiktok")).toBe("TikTok");
    expect(getCategoryLabel("youtube")).toBe("YouTube");
    expect(getCategoryLabel("instagram")).toBe("Instagram");
  });

  it("getRelatedBlogSlugs returns slugs for known topics", () => {
    const slugs = getRelatedBlogSlugs("tiktok", "funny-captions");
    expect(slugs).toContain("funny-tiktok-captions");
  });

  it("getRelatedSeoPages returns up to 3 related pages", () => {
    const related = getRelatedSeoPages("tiktok", "funny-captions");
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.every((r) => r.category === "tiktok")).toBe(true);
    expect(related.some((r) => r.topic === "funny-captions")).toBe(false);
  });

  it("getWritingTips returns tips for captions, titles, hooks", () => {
    expect(getWritingTips("funny-captions")).toHaveLength(5);
    expect(getWritingTips("gaming-titles")).toHaveLength(5);
    expect(getWritingTips("viral-hooks")).toHaveLength(5);
  });
});
