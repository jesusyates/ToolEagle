import Link from "next/link";
import { getTrafficInjectionContext } from "@/lib/traffic-injection-data";

/** Homepage: 🔥 Trending: Make Money with AI — top money pages */
export async function TrendingMakeMoneySection() {
  const { pages } = await getTrafficInjectionContext({ locale: "zh" });
  const top = pages.slice(0, 6);
  if (top.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-amber-50 to-white border-y border-amber-100">
      <div className="container py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">🔥 Trending now</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Trending: Make Money with AI</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              High-value guides readers are clicking right now — jump in while traffic is hot.
            </p>
          </div>
          <Link
            href="/zh/sitemap"
            className="text-sm font-semibold text-sky-600 hover:text-sky-800 shrink-0"
          >
            All guides →
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((p) => (
            <li key={`${p.pageType}-${p.slug}`}>
              <Link
                href={p.href.replace(/^https?:\/\/[^/]+/, "")}
                className="block rounded-2xl border-2 border-amber-200 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition"
              >
                <span className="text-xs font-semibold text-amber-700">🔥 Trending now</span>
                <p className="mt-2 font-semibold text-slate-900 line-clamp-2">{p.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.pageType === "en-how-to" ? "EN guide" : "中文指南"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
