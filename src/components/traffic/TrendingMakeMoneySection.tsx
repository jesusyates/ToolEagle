import Link from "next/link";
import { getTrafficInjectionContext } from "@/lib/traffic-injection-data";
import { getAllEnHowToSlugs, getEnHowToContent } from "@/lib/en-how-to-content";
import { BASE_URL } from "@/config/site";
import type { InjectionMoneyPage } from "@/lib/traffic-injection-data";

type Props = {
  /**
   * Global homepage: EN how-to guides only — no `/zh` links or 中文指南 labels.
   * @default false — legacy behavior (e.g. zh-oriented dashboards) unchanged.
   */
  englishOnly?: boolean;
};

/** Homepage: trending high-value guides — locale depends on `englishOnly` */
export async function TrendingMakeMoneySection({ englishOnly = false }: Props) {
  const locale = englishOnly ? "en" : "zh";
  const { pages } = await getTrafficInjectionContext({ locale });
  let ranked = englishOnly ? pages.filter((p) => p.pageType === "en-how-to") : pages;

  if (englishOnly && ranked.length < 3) {
    const seen = new Set(ranked.map((p) => p.slug));
    const extra: InjectionMoneyPage[] = [];
    for (const slug of getAllEnHowToSlugs()) {
      if (extra.length + ranked.length >= 8) break;
      if (seen.has(slug)) continue;
      const en = getEnHowToContent(slug);
      if (!en) continue;
      extra.push({
        slug,
        title: en.title,
        titleZh: en.title,
        titleEn: en.title,
        href: `${BASE_URL}/en/how-to/${slug}`,
        pageType: "en-how-to",
        keyword: slug,
        injectionWeight: 1
      });
      seen.add(slug);
    }
    ranked = [...ranked, ...extra];
  }

  const top = ranked.slice(0, 6);
  if (top.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white border-y border-slate-200">
      <div className="container py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Guides</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
              {englishOnly ? "How-to playbooks" : "Trending: Make Money with AI"}
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              {englishOnly
                ? "Long-form guides for growth, packaging, and distribution — SEO-friendly, skimmable."
                : "High-value guides readers are clicking right now — jump in while traffic is hot."}
            </p>
          </div>
          <Link
            href={englishOnly ? "/en/how-to" : "/zh/sitemap"}
            className="text-sm font-semibold text-sky-600 hover:text-sky-800 shrink-0"
          >
            {englishOnly ? "All English guides →" : "All guides →"}
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((p) => {
            const cardTitle = englishOnly ? (p.titleEn?.trim() || p.title) : p.title;
            return (
              <li key={`${p.pageType}-${p.slug}`}>
                <Link
                  href={p.href.replace(/^https?:\/\/[^/]+/, "")}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300 hover:shadow-md transition"
                >
                  <span className="text-xs font-semibold text-sky-700">Guide</span>
                  <p className="mt-2 font-semibold text-slate-900 line-clamp-2">{cardTitle}</p>
                  {!englishOnly ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {p.pageType === "en-how-to" ? "EN guide" : "中文指南"}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">How-to</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
