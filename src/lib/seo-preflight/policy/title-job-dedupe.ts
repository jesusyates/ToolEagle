/**
 * Reject titles that repeat the same structural template within one preflight job
 * (after replacing the topic keyword).
 */

export function structuralTitleFingerprint(title: string, topicSeed: string): string {
  const t = title.trim().toLowerCase();
  const k = topicSeed.replace(/\s+/g, " ").trim().toLowerCase();
  if (!k) return t;
  let out = t;
  let idx = out.indexOf(k);
  while (idx >= 0) {
    out = out.slice(0, idx) + "{{topic}}" + out.slice(idx + k.length);
    idx = out.indexOf(k);
  }
  return out.replace(/\s+/g, " ").trim();
}
