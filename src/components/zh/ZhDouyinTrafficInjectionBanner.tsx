import Link from "next/link";
import { ZH } from "@/lib/zh-site/paths";

type Props = {
  className?: string;
  /** Tighter padding for sub-layouts */
  compact?: boolean;
};

/**
 * V105.2 — Visible funnel into Douyin monetization cluster (/zh/douyin).
 */
export function ZhDouyinTrafficInjectionBanner({ className = "", compact }: Props) {
  return (
    <aside
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-amber-50/80 to-red-50/90 px-4 ${compact ? "py-2.5" : "py-3"} shadow-sm ${className}`}
      aria-label="抖音创作者工具"
    >
      <Link
        href={ZH.douyin}
        className="inline-flex items-center gap-2 text-sm font-bold text-red-950 hover:text-red-800 transition"
      >
        <span aria-hidden>🔥</span>
        <span>抖音创作者工具</span>
        <span className="text-red-700" aria-hidden>
          →
        </span>
      </Link>
      <p className="text-xs text-slate-600 max-w-md leading-snug">
        钩子、选题、文案包、口播与评论引导——站内闭环，免费试方向，Pro 解锁完整包。
      </p>
    </aside>
  );
}
