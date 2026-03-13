type ToolCopyButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function ToolCopyButton({ label, onClick, disabled }: ToolCopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-800 hover:border-sky-500/80 hover:text-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {label}
    </button>
  );
}

