import Link from "next/link";
import { getTrafficInjectionContext } from "@/lib/traffic-injection-data";

type Props = {
  /** Current page slug — excluded from list */
  excludeSlug?: string;
  lang: "zh" | "en";
};

/** Internal traffic boost: 🔥 People are reading this now */
export async function PeopleReadingMoneyBlock({ excludeSlug, lang }: Props) {
  const { pages } = await getTrafficInjectionContext({ locale: lang === "en" ? "en" : "zh" });
  const list = pages.filter((p) => p.slug !== excludeSlug).slice(0, 5);
  if (list.length === 0) return null;

  const title =
    lang === "zh" ? "🔥 大家正在读这些（高价值）" : "🔥 People are reading this now";
  const subtitle =
    lang === "zh"
      ? "站内热门赚钱与增长类指南，内链加权推送。"
      : "Trending money and growth guides — internal traffic boost.";

  return (
    <section
      className="mt-10 rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6"
      aria-label={title}
    >
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      <ul className="mt-4 space-y-2">
        {list.map((p) => (
          <li key={`${p.pageType}-${p.slug}`}>
            <Link
              href={p.href.replace(/^https?:\/\/[^/]+/, "")}
              className="flex items-start gap-2 text-sm font-medium text-sky-800 hover:text-sky-950 hover:underline"
            >
              <span className="shrink-0 text-amber-600">🔥</span>
              <span className="line-clamp-2">{p.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
