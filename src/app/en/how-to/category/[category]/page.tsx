import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import {
  EN_HOW_TO_CATEGORIES,
  getEnHowToItemsByCategory,
  type EnHowToCategorySlug
} from "@/lib/en-how-to-categories";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ category: string }> };

function isCategory(v: string): v is EnHowToCategorySlug {
  return EN_HOW_TO_CATEGORIES.some((c) => c.slug === v);
}

export async function generateStaticParams() {
  return EN_HOW_TO_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return { title: "Not Found" };
  const label = EN_HOW_TO_CATEGORIES.find((c) => c.slug === category)?.label ?? "Guides";
  const url = `${BASE_URL}/en/how-to/category/${category}`;
  return {
    title: `${label} how-to guides | ToolEagle`,
    description: `How-to guides for ${label} creators and marketers.`,
    alternates: { canonical: url },
    openGraph: { title: `${label} how-to guides | ToolEagle`, url }
  };
}

export default async function EnHowToCategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  const label = EN_HOW_TO_CATEGORIES.find((c) => c.slug === category)?.label ?? "Guides";
  const items = getEnHowToItemsByCategory(category);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-3xl">
            <nav className="text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-slate-700">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/en/how-to" className="hover:text-slate-700">
                How-To Guides
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">{label}</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              {label} how-to guides
            </h1>
            <p className="mt-5 text-slate-700 leading-relaxed">
              {items.length} guide{items.length === 1 ? "" : "s"} in this category.
            </p>

            <ul className="mt-8 space-y-2">
              {items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/en/how-to/${item.slug}`}
                    className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sky-700 hover:text-sky-800 hover:border-sky-200 hover:bg-sky-50/40 font-medium transition"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}

