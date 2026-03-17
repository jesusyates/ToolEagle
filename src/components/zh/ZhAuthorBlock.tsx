/**
 * V66 Author Entity - E-E-A-T signal
 */
export function ZhAuthorBlock() {
  return (
    <section
      className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-5"
      aria-label="作者"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-700 text-lg font-bold text-white">
          T
        </div>
        <div>
          <p className="font-semibold text-slate-900">作者：ToolEagle AI Team</p>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            AI 内容增长专家，帮助创作者提升流量和收入。专注 TikTok、YouTube、Instagram 等平台的涨粉、变现与内容策略。
          </p>
        </div>
      </div>
    </section>
  );
}
