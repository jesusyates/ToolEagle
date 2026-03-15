import Link from "next/link";
import { tools } from "@/config/tools";

type SeoToolCTAProps = {
  toolSlug: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
};

export function SeoToolCTA({
  toolSlug,
  title,
  description,
  buttonLabel = "Generate with AI"
}: SeoToolCTAProps) {
  const tool = tools.find((t) => t.slug === toolSlug);
  const Icon = tool?.icon ?? null;

  return (
    <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-sky-200">
            <Icon className="h-6 w-6 text-sky-700" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">
            {title ?? tool?.name ?? "AI Generator"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {description ?? tool?.description ?? "Generate content instantly with AI. No sign-up required."}
          </p>
          <Link
            href={`/tools/${toolSlug}`}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition duration-150"
          >
            {buttonLabel} →
          </Link>
        </div>
      </div>
    </section>
  );
}
