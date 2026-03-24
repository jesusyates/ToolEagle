import { Bird } from "lucide-react";

type Props = {
  /** `global` — 英文主站（青→蓝）；`cn` — 中文站（暖色→青绿，贴近原 11.png） */
  variant?: "global" | "cn";
  className?: string;
};

/**
 * 顶栏 Logo：整块 44×44 铺满渐变圆角方，中心白鸟标 — 不依赖 PNG，避免缩略图留白。
 */
export function ToolEagleLogoMark({ variant = "global", className = "" }: Props) {
  const grad =
    variant === "cn"
      ? "bg-gradient-to-tr from-orange-500 via-amber-400 to-teal-500"
      : "bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600";

  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/10 ${grad} ${className}`}
      aria-hidden
    >
      <Bird className="h-8 w-8 text-white drop-shadow-sm" strokeWidth={2} />
    </span>
  );
}
