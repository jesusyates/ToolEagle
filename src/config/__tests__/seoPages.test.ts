import { seoPages, getSeoPageBySlug, getSeoPageSlugs } from "../seoPages";
import { tools } from "../tools";

describe("seoPages config", () => {
  it("has required SEO pages", () => {
    const slugs = getSeoPageSlugs();
    expect(slugs).toContain("tiktok-captions");
    expect(slugs).toContain("youtube-titles");
    expect(slugs).toContain("instagram-captions");
  });

  it("each page has required fields", () => {
    seoPages.forEach((page) => {
      expect(page).toHaveProperty("slug");
      expect(page).toHaveProperty("title");
      expect(page).toHaveProperty("metaDescription");
      expect(page).toHaveProperty("h1");
      expect(page).toHaveProperty("intro");
      expect(Array.isArray(page.examples)).toBe(true);
      expect(Array.isArray(page.toolSlugs)).toBe(true);
    });
  });

  it("toolSlugs reference existing tools", () => {
    seoPages.forEach((page) => {
      page.toolSlugs.forEach((slug) => {
        const found = tools.find((t) => t.slug === slug);
        expect(found).toBeDefined();
      });
    });
  });

  it("getSeoPageBySlug returns correct page", () => {
    const page = getSeoPageBySlug("tiktok-captions");
    expect(page?.slug).toBe("tiktok-captions");
    expect(page?.h1).toBe("TikTok Captions");
  });

  it("getSeoPageBySlug returns undefined for unknown slug", () => {
    expect(getSeoPageBySlug("unknown")).toBeUndefined();
  });
});
