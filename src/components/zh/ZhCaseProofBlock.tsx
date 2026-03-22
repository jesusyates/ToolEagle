/**
 * V80: Case proof block - numeric results, variation
 */

type Props = {
  keyword?: string;
};

const CASE_PROOFS = [
  "3天涨粉1000+",
  "视频播放提升200%",
  "0基础也能生成爆款内容",
  "从0到1实现账号变现",
  "文案生成效率提升10倍",
  "10分钟搞定一天的内容创作",
  "7天涨粉500+",
  "完播率提升150%",
  "互动率翻倍",
  "14天账号起号成功"
];

function hashSlug(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function ZhCaseProofBlock({ keyword }: Props) {
  const idx = keyword ? hashSlug(keyword) % CASE_PROOFS.length : 0;
  const proofs = [
    CASE_PROOFS[idx],
    CASE_PROOFS[(idx + 1) % CASE_PROOFS.length],
    CASE_PROOFS[(idx + 2) % CASE_PROOFS.length],
    CASE_PROOFS[(idx + 3) % CASE_PROOFS.length],
    CASE_PROOFS[(idx + 4) % CASE_PROOFS.length]
  ];

  return (
    <section
      className="mt-10 rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 p-6"
      aria-label="真实效果"
    >
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
        ✨ 真实效果
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {keyword ? `实现「${keyword}」的创作者都在用` : "创作者真实反馈"}
      </p>
      <ul className="mt-4 space-y-3">
        {proofs.map((proof, i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <span className="text-emerald-500">✓</span>
            {proof}
          </li>
        ))}
      </ul>
    </section>
  );
}
