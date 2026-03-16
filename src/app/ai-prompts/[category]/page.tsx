import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { PROMPT_CATEGORIES, PROMPTS, type PromptCategory } from "@/config/prompt-library";
import { PromptCard } from "./PromptCard";
import { BASE_URL } from "@/config/site";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  return PROMPT_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = PROMPT_CATEGORIES.find((c) => c.slug === category);
  if (!cat) return { title: "Not Found" };

  return {
    title: `${cat.name} Prompts | AI Prompt Library`,
    description: `10 ${cat.name.toLowerCase()} prompts. Copy and use in ChatGPT, Claude, or ToolEagle tools.`,
    alternates: { canonical: `${BASE_URL}/ai-prompts/${category}` }
  };
}

export default async function AiPromptsCategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = PROMPT_CATEGORIES.find((c) => c.slug === category);
  if (!cat) notFound();

  const prompts = PROMPTS[cat.id as PromptCategory] ?? [];

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-3xl mx-auto">
            <Link href="/ai-prompts" className="text-sm font-medium text-sky-600 hover:underline">
              ← Prompt Library
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              {cat.name} Prompts
            </h1>
            <p className="mt-2 text-slate-600">
              Copy and customize these prompts for ChatGPT, Claude, or ToolEagle tools.
            </p>

            <div className="mt-8 space-y-4">
              {prompts.map((p, i) => (
                <PromptCard key={i} prompt={p} />
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/ai-prompt-improver" className="text-sm font-medium text-sky-600 hover:underline">
                Improve your prompts →
              </Link>
              <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
                Use this prompt in ToolEagle tools →
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
