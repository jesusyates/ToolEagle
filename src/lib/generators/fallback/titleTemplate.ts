/** Local fallback when AI is unavailable — must stay in sync with title-generator quality audit. */
const titlePatterns = [
  "I Tried {topic} So You Don't Have To",
  "{number} {topic} No One Talks About",
  "Stop Doing {wrong} (Do This Instead)",
  "{topic} in {time}: Full Guide",
  "The Truth About {topic}",
  "{number} Mistakes Killing Your {topic}"
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

export function generateTitleTemplate(trimmed: string): string[] {
  const replacements: Record<string, string> = {
    "{topic}": trimmed,
    "{number}": "7",
    "{time}": "10 Minutes",
    "{wrong}": trimmed.toLowerCase()
  };
  return shuffle(titlePatterns)
    .map((pattern) => pattern.replace(/\{[^}]+\}/g, (match) => replacements[match] ?? trimmed))
    .slice(0, 6);
}
