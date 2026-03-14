import { Metadata } from "next";
import Link from "next/link";
import { decodeResultFromShare } from "@/lib/share";
import { tools } from "@/config/tools";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const decoded = decodeResultFromShare(id);
  const tool = decoded ? tools.find((t) => t.slug === decoded.toolSlug) : null;
  const title = tool ? `${tool.name} Result` : "Shared Result";
  return {
    title,
    description: "View shared content from ToolEagle"
  };
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;
  const decoded = decodeResultFromShare(id);
  const tool = decoded ? tools.find((t) => t.slug === decoded.toolSlug) : null;

  if (!decoded || !tool) {
    return (
      <main className="min-h-screen bg-white text-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-1 container py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Result not found</h1>
          <p className="mt-2 text-slate-600">This link may be invalid or expired.</p>
          <Link
            href="/tools"
            className="mt-6 inline-block text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            Browse tools →
          </Link>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Shared from {tool.name}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Generated results
          </h1>
          <div className="mt-6 space-y-3">
            {decoded.items.map((text, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 whitespace-pre-line"
              >
                <span className="text-slate-500 font-medium mr-2">{i + 1}.</span>
                {text}
              </div>
            ))}
          </div>
          <Link
            href={`/tools/${tool.slug}`}
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            Try {tool.name} →
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
