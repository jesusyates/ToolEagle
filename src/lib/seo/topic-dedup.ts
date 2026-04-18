export function normalizeSemanticKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\bhow to\b/g, "")
    .replace(/\bbest\b/g, "")
    .replace(/\bexamples?\b/g, "")
    .replace(/\bcompared\b/g, "")
    .replace(/\bvs\b/g, "")
    .replace(/\btools?\b/g, "")
    .replace(/\bgenerator\b/g, "")
    .replace(/\bsoftware\b/g, "")
    .replace(/\bai\b/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSemanticSet(items: { title: string }[]): Set<string> {
  const set = new Set<string>();

  for (const item of items) {
    const key = normalizeSemanticKey(item.title);
    if (key) set.add(key);
  }

  return set;
}

export function isSemanticDuplicate(title: string, existingSet: Set<string>): boolean {
  const key = normalizeSemanticKey(title);

  if (!key) return false;

  if (existingSet.has(key)) return true;

  for (const existing of existingSet) {
    if (existing.includes(key) || key.includes(existing)) {
      return true;
    }
  }

  return false;
}
