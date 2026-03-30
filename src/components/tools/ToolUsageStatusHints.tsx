import type { UsageStatusUiSlice } from "@/lib/usage-status-client";

type Props = {
  zhUi: boolean;
  ui: UsageStatusUiSlice;
  /** Shorter CN note for simple list tools (vs full post-package copy). */
  creditsHelperZh?: string;
};

export function ToolUsageStatusHints({ zhUi, ui, creditsHelperZh }: Props) {
  const { cnBilling, cnCreditsRemaining, cnCreditsDaysLeft, usageRemaining } = ui;
  const creditsNote =
    creditsHelperZh ?? "每次 AI 生成会消耗算力包次数。";

  return (
    <>
      {zhUi && cnBilling === "credits" && cnCreditsRemaining !== null && cnCreditsRemaining > 0 ? (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950">
          <span className="font-semibold">
            剩余 {cnCreditsRemaining} 次
            {cnCreditsDaysLeft !== null ? `（有效期 ${cnCreditsDaysLeft} 天）` : ""}
          </span>
          <p className="mt-1 text-[11px] text-emerald-900/80">{creditsNote}</p>
        </div>
      ) : null}
      {zhUi && cnBilling === "legacy_pro" ? (
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          当前为 Pro 权益（或已迁移算力包）；生成按次数计费时以剩余次数为准。
        </div>
      ) : null}
      {usageRemaining !== null && !(zhUi && cnBilling === "credits" && (cnCreditsRemaining ?? 0) > 0) ? (
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <span className="font-semibold text-slate-800">
            {zhUi ? "今日剩余：" : "Today's remaining: "}
            <span className={usageRemaining <= 1 ? "text-rose-700 font-bold" : "text-slate-900"}>
              {usageRemaining}
            </span>
            {zhUi ? "次" : " runs"}
          </span>
        </div>
      ) : null}
    </>
  );
}
