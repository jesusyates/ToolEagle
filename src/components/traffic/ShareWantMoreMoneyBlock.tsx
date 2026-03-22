import Link from "next/link";
import { getTrafficInjectionContext } from "@/lib/traffic-injection-data";

/** /share/[id] — Want more like this? → money pages */
export async function ShareWantMoreMoneyBlock() {
  const { pages } = await getTrafficInjectionContext({ locale: "en" });
  const list = pages.slice(0, 5);
  if (list.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 p-6">
      <h2 className="text-lg font-semibold text-slate-900">👉 Want more like this?</h2>
      <p className="mt-1 text-sm text-slate-600">
        Trending guides that turn content into traffic and revenue.
      </p>
      <ul className="mt-4 space-y-2">
        {list.map((p) => (
          <li key={`${p.pageType}-${p.slug}`}>
            <Link
              href={p.href.replace(/^https?:\/\/[^/]+/, "")}
              className="text-sm font-medium text-emerald-900 hover:underline"
            >
              🔥 {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
