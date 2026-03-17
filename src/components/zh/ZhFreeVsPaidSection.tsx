type Props = {
  keyword?: string;
};

export function ZhFreeVsPaidSection({ keyword }: Props) {
  return (
    <section
      className="mt-10 rounded-2xl border-2 border-slate-200 bg-slate-50 p-6"
      aria-label="免费 vs 工具加速"
    >
      <h2 className="text-xl font-semibold text-slate-900">免费方法 vs 工具加速</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-medium text-slate-900">免费方法</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>• 手动创作，耗时较长</li>
            <li>• 需要反复试错</li>
            <li>• 学习曲线陡峭</li>
          </ul>
        </div>
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
          <h3 className="font-medium text-slate-900">工具加速</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>• AI 一键生成，效率提升 10 倍</li>
            <li>• 专业模板，少走弯路</li>
            <li>• 新手也能快速上手</li>
          </ul>
          <p className="mt-3 text-sm font-medium text-amber-800">
            {keyword ? `实现「${keyword}」更轻松，试试推荐工具 →` : "试试上方推荐工具，免费试用 →"}
          </p>
        </div>
      </div>
    </section>
  );
}
