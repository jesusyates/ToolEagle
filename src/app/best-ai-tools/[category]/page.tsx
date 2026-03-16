import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import {
  getAIToolCategory,
  getAIToolsByCategory,
  BEST_AI_TOOLS_CATEGORIES,
  type AIToolCategory
} from "@/config/ai-tools-marketplace";
import { BASE_URL } from "@/config/site";

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return BEST_AI_TOOLS_CATEGORIES.map((slug) => ({ category: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = getAIToolCategory(category);
  if (!cat) return { title: "Not Found" };
  const label = cat.name.replace("AI ", "AI ").replace(" Tools", "");
  return {
    title: `Best ${cat.name} (2026) | ToolEagle`,
    description: `Compare the best ${cat.name.toLowerCase()}. Free and paid options for creators.`,
    alternates: { canonical: `${BASE_URL}/best-ai-tools/${category}` },
    openGraph: {
      title: `Best ${cat.name} (2026) | ToolEagle`,
      description: `Compare the best ${cat.name.toLowerCase()}.`,
      url: `${BASE_URL}/best-ai-tools/${category}`
    }
  };
}

export default async function BestAIToolsCategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getAIToolCategory(category);
  if (!cat) notFound();

  const tools = getAIToolsByCategory(category as AIToolCategory);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <article className="container max-w-3xl py-12">
          <Link href="/ai-tools" className="text-sm font-medium text-sky-600 hover:underline">
            ← AI Tools Directory
          </Link>

          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Best {cat.name} (2026)
          </h1>
          <p className="mt-4 text-slate-600">
            We compared the top {cat.name.toLowerCase()} for creators. Free and paid options.
          </p>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Our picks</h2>
            <ul className="mt-4 space-y-4">
              {tools.map((t, i) => (
                <li key={t.slug}>
                  <Link
                    href={t.isTooleagle && t.toolSlug ? `/tools/${t.toolSlug}` : `/ai-tools/${t.slug}`}
                    className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">
                        {i + 1}. {t.name}
                      </span>
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

          <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Try ToolEagle for free</h2>
            <p className="mt-2 text-slate-600">
              Generate {category === "caption" ? "captions" : category === "hook" ? "hooks" : "content"} in seconds. No sign-up required.
            </p>
            <Link
              href="/tools/tiktok-caption-generator"
              className="mt-4 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Try free →
            </Link>
          </section>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/ai-tools" className="text-sm font-medium text-sky-600 hover:underline">
              All AI tools
            </Link>
            <Link href={`/ai-tools/category/${category}`} className="text-sm font-medium text-sky-600 hover:underline">
              {cat.name}
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
