type Props = {
  keyword?: string;
};

const CASE_PROOFS = [
  "使用该工具，3天涨粉1000+",
  "0基础也能生成爆款内容",
  "从0到1实现账号变现",
  "文案生成效率提升10倍",
  "10分钟搞定一天的内容创作"
];

export function ZhCaseProofBlock({ keyword }: Props) {
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
        {CASE_PROOFS.map((proof, i) => (
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
