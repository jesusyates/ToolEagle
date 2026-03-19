"use client";

type Props = {
  keyword?: string;
  manualTime?: string;
  toolTime?: string;
};

export function ZhValueAnchorPricing({
  keyword,
  manualTime = "1小时",
  toolTime = "5分钟"
}: Props) {
  return (
    <section
      className="mt-10 rounded-2xl border-2 border-slate-200 bg-slate-50 p-6"
      aria-label="效率对比"
    >
      <h2 className="text-xl font-semibold text-slate-900">⏱ 手动 vs 工具，差多少？</h2>
      <p className="mt-2 text-sm text-slate-600">
        {keyword ? `实现「${keyword}」：` : "同样的任务："}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-500">免费方案（慢）</p>
          <p className="mt-2 text-2xl font-bold text-slate-700">手动：{manualTime}</p>
          <p className="mt-1 text-xs text-slate-500">自己写、自己改、自己试</p>
        </div>
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 ring-2 ring-amber-200">
          <p className="text-sm font-medium text-amber-800">工具方案（快）</p>
          <p className="mt-2 text-2xl font-bold text-amber-900">工具：{toolTime}</p>
          <p className="mt-1 text-xs text-amber-700">一键生成，直接可用</p>
        </div>
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-slate-700">
        👉 强化购买理由：省下的时间 = 更多内容 = 更多收益
      </p>
    </section>
  );
}
