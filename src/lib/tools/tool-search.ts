import type { ToolConfig } from "@/config/tools";

export function filterToolsBySearch(tools: ToolConfig[], query: string): ToolConfig[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  return tools.filter((t) => {
    const hay = `${t.name} ${t.slug} ${t.category} ${t.description}`.toLowerCase();
    return hay.includes(q);
  });
}

export function rankToolSearchResults(tools: ToolConfig[], query: string): ToolConfig[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;

  const score = (t: ToolConfig): number => {
    const name = t.name.toLowerCase();
    const slug = t.slug.toLowerCase();
    const category = t.category.toLowerCase();
    if (name.startsWith(q)) return 100;
    if (slug.startsWith(q)) return 90;
    if (name.includes(q)) return 80;
    if (slug.includes(q)) return 70;
    if (category.includes(q)) return 60;
    return 10;
  };

  return [...tools].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
}

