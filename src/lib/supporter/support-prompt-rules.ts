/**
 * V100.2 — Show support prompt at specific lifetime generation counts (value moments).
 */

export const SUPPORT_PROMPT_MILESTONES = [1, 4, 8] as const;

export type SupportPromptMilestone = (typeof SUPPORT_PROMPT_MILESTONES)[number];

export const LS_SEEN_MILESTONES = "te_support_prompt_seen_milestones";

export function parseSeenMilestones(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_SEEN_MILESTONES);
    const a = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(a) ? a.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function markMilestoneSeen(milestone: number): void {
  if (typeof window === "undefined") return;
  try {
    const cur = new Set(parseSeenMilestones());
    cur.add(milestone);
    localStorage.setItem(LS_SEEN_MILESTONES, JSON.stringify([...cur].sort((a, b) => a - b)));
  } catch {
    /* ignore */
  }
}

export function shouldShowSupportPromptAtCount(
  lifetimeGenCount: number,
  hasRecordedSupport: boolean,
  seenMilestones: number[]
): SupportPromptMilestone | null {
  if (hasRecordedSupport || lifetimeGenCount < 1) return null;
  const seen = new Set(seenMilestones);
  for (const m of SUPPORT_PROMPT_MILESTONES) {
    if (lifetimeGenCount === m && !seen.has(m)) {
      return m;
    }
  }
  return null;
}
