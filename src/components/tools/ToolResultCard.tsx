import { ReactNode } from "react";

type ToolResultCardProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ToolResultCard({ title, actions, children }: ToolResultCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="text-xs font-medium text-slate-700">{title}</p>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 whitespace-pre-line min-h-[80px]">
        {children}
      </div>
    </div>
  );
}

