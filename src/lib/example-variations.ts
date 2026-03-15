/**
 * Programmatic example variations for /examples/[slug]-N
 * Generates 10-30 variations from a base example
 */

const CAPTION_PREFIXES = [
  "Save this for later 📌 ",
  "POV: ",
  "Nobody talks about this… ",
  "Real talk 💀 ",
  "That's it. That's the post. ",
  "Vibes only ✨ ",
  "No cap. ",
  "Comment if you agree 👇 ",
  "Tag someone who needs this ",
  "Stop scrolling for a sec 👇 ",
  "Wait for it… ",
  "The one thing nobody tells you: ",
  "You need to see this 👇 ",
  "Period. ",
  "Facts. ",
  "This hit different 😂 ",
  "Swipe for more 👉 ",
  "The truth about this: ",
  "Trust the process. ",
  "Main character energy ✨ ",
  "It's giving ",
  "Slay. ",
  "Iconic. ",
  "Unpopular opinion: ",
  "Hot take: ",
  "No thoughts just vibes ",
  "Literally me. ",
  "Same energy. ",
  "Mood. ",
  "Vibe check ✅ "
];

const HOOK_PREFIXES = [
  "Stop scrolling if you want this. ",
  "You're doing this wrong, here's why: ",
  "No one is talking about this. ",
  "If you want this, watch this. ",
  "I tried this so you don't have to. ",
  "Nobody tells you this. ",
  "The secret that changed everything: ",
  "What happens when you try: ",
  "The truth about this: ",
  "Why this matters: ",
  "How to do this in 3 seconds: ",
  "The hack nobody uses: ",
  "POV: you finally get it. ",
  "The formula that works: ",
  "Why yours isn't working: ",
  "The mistake everyone makes: ",
  "Wait for it. ",
  "You won't believe this. ",
  "This changed everything. ",
  "Don't skip this. ",
  "Listen up. ",
  "Pay attention. ",
  "You need to see this. ",
  "Game changer. ",
  "Thank me later. ",
  "Trust me on this. ",
  "One minute. ",
  "Quick tip: ",
  "No one talks about this. ",
  "Underrated tip: "
];

const EMOJI_SUFFIXES = ["", " ✨", " 🔥", " 👇", " 💀", " 😂", " 📌", " 👀", " 💪", " 🎯"];

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function parseExampleSlug(slug: string): { baseSlug: string; variationIndex: number | null } {
  const match = slug.match(/^(.+)-(\d+)$/);
  if (match) {
    const baseSlug = match[1];
    const n = parseInt(match[2], 10);
    if (n >= 1 && n <= 30) {
      return { baseSlug, variationIndex: n };
    }
  }
  return { baseSlug: slug, variationIndex: null };
}

export function generateVariation(
  baseResult: string,
  index: number,
  toolSlug: string
): string {
  const isHook = toolSlug.includes("hook") || toolSlug.includes("youtube");
  const prefixes = isHook ? HOOK_PREFIXES : CAPTION_PREFIXES;
  const seed = simpleHash(baseResult) + index;

  if (index === 0) return baseResult;

  const prefix = prefixes[(seed + index) % prefixes.length];
  const emojiSuffix = EMOJI_SUFFIXES[(seed + index * 7) % EMOJI_SUFFIXES.length];

  const core = baseResult
    .replace(/^[^\w]*/, "")
    .replace(/[\s\n]+/g, " ")
    .trim()
    .slice(0, 120);

  return `${prefix}${core}${emojiSuffix}`.trim();
}

export const VARIATION_COUNT = 20;

export function getVariationSlugs(baseSlug: string): string[] {
  return Array.from({ length: VARIATION_COUNT }, (_, i) => `${baseSlug}-${i + 1}`);
}
