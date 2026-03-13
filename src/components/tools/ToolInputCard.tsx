import { ReactNode } from "react";

type ToolInputCardProps = {
  label: string;
  children: ReactNode;
  helperText?: string;
};

export function ToolInputCard({ label, children, helperText }: ToolInputCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-700">
          {label}
        </label>
        {children}
        {helperText && (
          <p className="text-xs text-slate-500 leading-relaxed">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
}

