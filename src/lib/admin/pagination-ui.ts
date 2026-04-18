/** Shared numbered pagination model (1 … n, with ellipsis when many pages). */

export function buildPaginationItems(
  current: number,
  totalPages: number
): Array<{ type: "page"; n: number } | { type: "ellipsis" }> {
  if (totalPages <= 1) return [{ type: "page", n: 1 }];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({ type: "page" as const, n: i + 1 }));
  }
  const want = new Set<number>();
  want.add(1);
  want.add(totalPages);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= totalPages) want.add(p);
  }
  const sorted = [...want].sort((a, b) => a - b);
  const out: Array<{ type: "page"; n: number } | { type: "ellipsis" }> = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]!;
    if (i > 0) {
      const prev = sorted[i - 1]!;
      if (n - prev > 1) out.push({ type: "ellipsis" });
    }
    out.push({ type: "page", n });
  }
  return out;
}
