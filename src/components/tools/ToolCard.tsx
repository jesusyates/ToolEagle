import Link from "next/link";

export function ToolCard({
  href,
  icon: Icon,
  name,
  description,
  descriptionZh,
  category,
  categoryLabel,
  badge,
  locale = "en"
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  /** 与 `config/tools` 中 `descriptionZh` 一致；`locale=zh` 时优先于 description */
  descriptionZh?: string;
  category: string;
  /** 覆盖 category 展示（如中文场景标签） */
  categoryLabel?: string;
  badge?: "Popular" | "Trending";
  locale?: "en" | "zh";
}) {
  const cat = categoryLabel ?? category;
  const body =
    locale === "zh" && descriptionZh?.trim() ? descriptionZh : description;
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
        <div className="min-w-0 space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-xs font-medium text-slate-500 tracking-wide ${
                locale === "zh" ? "" : "uppercase"
              }`}
            >
              {cat}
            </p>
            {badge && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  badge === "Popular"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-sky-100 text-sky-700"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-900 leading-snug">
            {name}
          </h3>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        {body}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">
          {locale === "zh" ? "打开工具即可开始创作" : "Open the tool to start creating"}
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white group-hover:bg-slate-800">
          {locale === "zh" ? "打开工具" : "Open tool"}
        </span>
      </div>
    </Link>
  );
}

