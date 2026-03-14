import { tools, popularToolSlugs, toolCategories } from "../tools";

describe("tools config", () => {
  it("has all required tool fields", () => {
    tools.forEach((tool) => {
      expect(tool).toHaveProperty("slug");
      expect(tool).toHaveProperty("name");
      expect(tool).toHaveProperty("description");
      expect(tool).toHaveProperty("category");
      expect(tool).toHaveProperty("icon");
      expect(typeof tool.slug).toBe("string");
      expect(typeof tool.name).toBe("string");
      expect(toolCategories).toContain(tool.category);
    });
  });

  it("has unique slugs", () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("popularToolSlugs references existing tools", () => {
    popularToolSlugs.forEach((slug) => {
      const found = tools.find((t) => t.slug === slug);
      expect(found).toBeDefined();
    });
  });
});
