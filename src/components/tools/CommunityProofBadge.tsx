/**
 * V72: Community proof - "🔥 1,000+ creators using this tool"
 * Static first, later dynamic from analytics
 */
type Props = {
  count?: number;
};

export function CommunityProofBadge({ count = 1000 }: Props) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
      <span>🔥</span>
      <span>{count.toLocaleString()}+ creators using this tool</span>
    </p>
  );
}
