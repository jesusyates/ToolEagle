import Link from "next/link";
import {
  parseProgrammaticBlogSlug,
  formatTopicForBlog,
  PLATFORM_LABELS,
  TYPE_LABELS
} from "@/config/programmatic-blog";
import { getRealExamples } from "@/config/seo/content-templates";
import { TOOL_MAP } from "@/config/seo/content-types";
import { tools } from "@/config/tools";
import { SeoExampleBlock } from "@/components/seo/SeoExampleBlock";
import { AnswerLinks } from "@/components/seo/AnswerLinks";

type ProgrammaticBlogPostProps = {
  slug: string;
};

export function ProgrammaticBlogPost({ slug }: ProgrammaticBlogPostProps) {
  const parsed = parseProgrammaticBlogSlug(slug);
  if (!parsed) return null;

  const { topic, platform, type } = parsed;
  const topicLabel = formatTopicForBlog(topic);
  const platformLabel = PLATFORM_LABELS[platform] ?? platform;
  const typeLabel = TYPE_LABELS[type] ?? type;
  const toolSlug = TOOL_MAP[`${platform}_${type}`] ?? "tiktok-caption-generator";
  const tool = tools.find((t) => t.slug === toolSlug);
  const examples = getRealExamples(type, topic);

  return (
    <article className="container max-w-3xl pt-10 pb-16 prose prose-slate">
      <p className="text-xs text-sky-700 font-semibold uppercase tracking-[0.2em]">
        Resources
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
        Best {topicLabel} {platformLabel} {typeLabel}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {new Date().toISOString().slice(0, 10)} · ToolEagle
      </p>
      <p className="mt-3 text-slate-600 leading-relaxed">
        {topicLabel} {platformLabel} {typeLabel.toLowerCase()} that get views and engagement.
        Copy and use these examples or generate more with our free AI tool.
      </p>

      <hr className="my-6 border-slate-200" />

      <SeoExampleBlock
        examples={examples}
        topicLabel={topicLabel}
        platformLabel={platformLabel}
        typeLabel={typeLabel}
        toolSlug={toolSlug}
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">
          Why {topicLabel} {typeLabel.toLowerCase()} work
        </h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          {topicLabel} {platformLabel} {typeLabel.toLowerCase()} match your content vibe and help it stand out.
          They add personality, spark curiosity, and encourage engagement. The best {typeLabel.toLowerCase()} feel
          natural and fit your niche—use our AI generator to create options tailored to your voice.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Tips for {topicLabel} {typeLabel.toLowerCase()}</h2>
        <ul className="mt-3 space-y-2 text-slate-600">
          <li className="pl-4 border-l-2 border-slate-200">Keep it short—under 150 characters works best.</li>
          <li className="pl-4 border-l-2 border-slate-200">Match the tone of your content.</li>
          <li className="pl-4 border-l-2 border-slate-200">Use emojis sparingly to add personality.</li>
          <li className="pl-4 border-l-2 border-slate-200">End with a question or CTA to encourage comments.</li>
          <li className="pl-4 border-l-2 border-slate-200">Generate multiple options with our AI tool and pick the best.</li>
        </ul>
      </section>

      <hr className="my-8 border-slate-200" />

      <AnswerLinks
        platform={platform}
        type={type}
        platformLabel={platformLabel}
        typeLabel={typeLabel}
        limit={3}
      />

      <hr className="my-8 border-slate-200" />

      <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Generate {topicLabel} {typeLabel.toLowerCase()} with AI
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Use our free {tool?.name ?? "AI generator"} to create {topicLabel.toLowerCase()} {typeLabel.toLowerCase()} quickly, then continue with credits as needed.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/tools/${toolSlug}`}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Try {tool?.name ?? "AI Generator"} →
          </Link>
          <Link
            href="/creator"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Creator Mode →
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/blog" className="text-sm font-medium text-sky-600 hover:underline">
          ← Blog
        </Link>
        <Link href={`/${platform}/${type}/${topic}`} className="text-sm font-medium text-sky-600 hover:underline">
          More {topicLabel} {platformLabel} {typeLabel} →
        </Link>
        <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
          Creator Examples →
        </Link>
        <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
          Trending content →
        </Link>
        <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
          All AI Tools →
        </Link>
      </div>
    </article>
  );
}
