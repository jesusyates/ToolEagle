import Link from "next/link";
import { Video, Youtube, Instagram } from "lucide-react";
import { tools } from "@/config/tools";
import { ToolCard } from "@/components/tools/ToolCard";
import { contentTypes, CONTENT_TYPE_LABELS } from "@/config/seo/content-types";
import { formatTopicLabel } from "@/config/seo/topics";

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  tiktok: Video,
  youtube: Youtube,
  instagram: Instagram
};

type PlatformToolsPageProps = {
  platform: string;
  platformLabel: string;
  platformUrl: string;
};

export function PlatformToolsPage({
  platform,
  platformLabel,
  platformUrl
}: PlatformToolsPageProps) {
  const allTools = tools.filter((t) => t.slug.startsWith(`${platform}-`));

  const seoTypes = contentTypes.slice(0, 3);
  const sampleTopics = ["funny", "aesthetic", "gaming", "fitness", "viral"];

  return (
    <div className="flex-1">
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="container py-12">
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = PLATFORM_ICONS[platform];
              return Icon ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
                  <Icon className="h-8 w-8 text-slate-700" />
                </div>
              ) : null;
            })()}
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                {platformLabel} Tools
              </h1>
              <p className="mt-1 text-slate-600">
                Free AI tools for {platformLabel} creators. Captions, hooks, hashtags and more.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/creator"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
            >
              Creator Mode →
            </Link>
            <a
              href={platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Open {platformLabel} →
            </a>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              All tools
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <h2 className="text-lg font-semibold text-slate-900">
          {platformLabel} AI Tools
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Generate captions, hooks, titles and more with AI. No sign-up required.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allTools.map((tool) => (
            <ToolCard
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              icon={tool.icon}
              name={tool.name}
              description={tool.description}
              category={tool.category}
            />
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-lg font-semibold text-slate-900">
          Browse {platformLabel} ideas
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Explore {platformLabel} captions, hashtags and more by topic.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {seoTypes.map((type) =>
            sampleTopics.slice(0, 2).map((topic) => (
              <Link
                key={`${type}-${topic}`}
                href={`/${platform}/${type}/${topic}`}
                className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
              >
                {formatTopicLabel(topic)} {CONTENT_TYPE_LABELS[type]}
              </Link>
            ))
          )}
        </div>
        <Link
          href={`/${platform}/captions/funny`}
          className="mt-4 inline-block text-sm font-medium text-sky-600 hover:text-sky-800"
        >
          Browse all {platformLabel} ideas →
        </Link>
      </section>
    </div>
  );
}
