import Link from "next/link";

/**
 * V71: Tool → Content linking. Tool pages must link to:
 * - /zh/search/*
 * - /zh/how-to/*
 * - /ai-tools/*
 */
type Props = {
  toolSlug: string;
};

const ZH_HOW_TO_PLATFORMS: Record<string, string> = {
  "tiktok-caption-generator": "tiktok",
  "youtube-title-generator": "youtube",
  "hook-generator": "tiktok",
  "title-generator": "youtube",
  "hashtag-generator": "tiktok"
};

export function ToolContentLinksCard({ toolSlug }: Props) {
  const howToPlatform = ZH_HOW_TO_PLATFORMS[toolSlug] ?? "tiktok";

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
        Explore more
      </p>
      <ul className="mt-3 space-y-2">
        <li>
          <Link
            href="/zh/sitemap"
            className="text-sm text-slate-700 hover:text-sky-700 hover:underline transition duration-150"
          >
            /zh/search/* — 中文关键词指南
          </Link>
        </li>
        <li>
          <Link
            href={`/zh/how-to/${howToPlatform}`}
            className="text-sm text-slate-700 hover:text-sky-700 hover:underline transition duration-150"
          >
            /zh/how-to/* — 涨粉指南合集
          </Link>
        </li>
        <li>
          <Link
            href="/ai-tools"
            className="text-sm text-slate-700 hover:text-sky-700 hover:underline transition duration-150"
          >
            /ai-tools/* — AI 工具目录
          </Link>
        </li>
      </ul>
    </div>
  );
}
