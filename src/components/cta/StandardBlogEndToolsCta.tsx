import Link from "next/link";
import { TryToolCard } from "@/components/blog/TryToolCard";
import { TryToolsCard } from "@/components/blog/TryToolsCard";
import { BlogAnswerLinks } from "@/components/blog/BlogAnswerLinks";
import type { BlogFrontmatter } from "@/lib/blog";

type Props = { frontmatter: BlogFrontmatter };

/** V171.2 — Blog end-of-article: recommended tools + answer discovery. */
export function StandardBlogEndToolsCta({ frontmatter }: Props) {
  return (
    <>
      <div className="not-prose mt-6">
        {frontmatter.recommendedTools?.length ? (
          <TryToolsCard toolSlugs={frontmatter.recommendedTools} />
        ) : (
          <TryToolCard tags={frontmatter.tags} />
        )}
      </div>
      <hr className="my-8 border-slate-200" />
      <div className="not-prose">
        <p className="text-sm font-semibold text-slate-900 mb-2">Answer guides</p>
        <BlogAnswerLinks />
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
            All AI tools →
          </Link>
          <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
            All answers →
          </Link>
        </div>
      </div>
    </>
  );
}
