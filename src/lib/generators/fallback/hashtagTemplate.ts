/** Local fallback when AI is unavailable — must stay in sync with hashtag-generator quality audit. */
export function generateHashtagTemplate(trimmed: string): string[] {
  const baseTags = ["tiktok", "reels", "shorts", "contentcreator", "creator", "viral", "fyp", "tooleagle"];
  const keywords = trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((k) => k.replace(/[^a-z0-9]/g, ""));
  const all = [...keywords, ...baseTags];
  const unique = Array.from(new Set(all.filter(Boolean)));
  const variants: string[] = [];
  for (let i = 0; i < 4; i++) {
    const shuffled = [...unique].sort(() => 0.5 - Math.random());
    variants.push(
      shuffled
        .map((t) => `#${t}`)
        .slice(0, 14)
        .join(" ")
    );
  }
  return variants;
}
