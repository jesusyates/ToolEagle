/**
 * Rule-based long-tail / intent variants from a seed phrase (no NLP / embeddings).
 */
export function expandSeoKeywords(base: string): string[] {
  const b = base.toLowerCase().replace(/\s+/g, " ").trim();
  if (!b) return [];

  const variants: string[] = [];

  variants.push(`how to use ${b}`);
  variants.push(`how to start with ${b}`);
  variants.push(`how to improve ${b}`);
  variants.push(`how to optimize ${b}`);

  variants.push(`best ${b} tools`);
  variants.push(`best ${b} for beginners`);
  variants.push(`best ${b} for creators`);
  variants.push(`best ${b} for small business`);

  variants.push(`${b} vs alternatives`);
  variants.push(`${b} vs competitors`);
  variants.push(`${b} compared side by side`);

  variants.push(`${b} examples`);
  variants.push(`${b} before and after`);
  variants.push(`real ${b} examples`);

  return variants;
}
