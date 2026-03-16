import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";
import {
  getAIToolCategory,
  getAIToolsByCategory,
  AI_TOOL_CATEGORIES,
  type AIToolCategory
} from "@/config/ai-tools-marketplace";

const BASE_URL = "https://www.tooleagle.com";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return AI_TOOL_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = getAIToolCategory(slug);
  if (!cat) return { title: "Not Found" };
  return {
    title: `${cat.name} | ToolEagle`,
    description: cat.description,
    alternates: { canonical: `${BASE_URL}/ai-tools/category/${slug}` },
    openGraph: {
      title: `${cat.name} | ToolEagle`,
      description: cat.description,
      url: `${BASE_URL}/ai-tools/category/${slug}`
    }
  };
}

export default async function AIToolsCategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = getAIToolCategory(slug);
  if (!cat) notFound();

  const tools = getAIToolsByCategory(slug as AIToolCategory);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/ai-tools" className="text-sm font-medium text-sky-600 hover:underline">
            ← AI Tools Directory
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {cat.name}
          </h1>
          <p className="mt-4 text-slate-600">{cat.description}</p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Tools</h2>
            <ul className="mt-4 space-y-3">
              {tools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={t.isTooleagle && t.toolSlug ? `/tools/${t.toolSlug}` : `/ai-tools/${t.slug}`}
                    className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{t.name}</span>
                      {t.isTooleagle && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/ai-tools" className="text-sm font-medium text-sky-600 hover:underline">
              All AI tools
            </Link>
            <Link href={`/best-ai-tools/${slug}`} className="text-sm font-medium text-sky-600 hover:underline">
              Best {cat.name}
            </Link>
            <Link href="/compare" className="text-sm font-medium text-sky-600 hover:underline">
              Compare tools
            </Link>
          </div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
