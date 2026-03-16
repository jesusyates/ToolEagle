/**
 * v52 - Creator post page template
 */

import Link from "next/link";
import type { CreatorPost } from "@/lib/creator-posts";
import { tools } from "@/config/tools";

type Props = {
  post: CreatorPost;
  type: "prompt" | "idea" | "guide";
};

function formatTopic(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CreatorPostPage({ post, type }: Props) {
  const author = post.creators as { username?: string; display_name?: string; avatar_url?: string } | undefined;
  const username = author?.username ?? "unknown";

  return (
    <article className="container max-w-3xl py-12">
      <Link href="/community" className="text-sm font-medium text-sky-600 hover:underline">
        ← Community
      </Link>

      <div className="mt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-sky-600">{type}</span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/creators/${username}`}
            className="text-sm font-medium text-slate-700 hover:text-sky-600 hover:underline"
          >
            {author?.display_name || author?.username || "Creator"}
          </Link>
          <span className="text-slate-400">·</span>
          <span className="text-sm text-slate-500">{new Date(post.created_at).toLocaleDateString()}</span>
          {post.topic && (
            <>
              <span className="text-slate-400">·</span>
              <Link href={`/topics/${post.topic}`} className="text-sm text-sky-600 hover:underline">
                {formatTopic(post.topic)}
              </Link>
            </>
          )}
        </div>
      </div>

      <section className="mt-8 prose prose-slate max-w-none">
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">{post.content}</div>
      </section>

      {(post.tags?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900">Tags</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {post.tags!.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {(post.tools?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900">Recommended Tools</h2>
          <ul className="mt-2 space-y-2">
            {post.tools!.map((slug) => {
              const tool = tools.find((t) => t.slug === slug);
              return (
                <li key={slug}>
                  <Link
                    href={`/tools/${slug}`}
                    className="text-sm text-sky-600 hover:underline"
                  >
                    {tool?.name ?? slug}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Related</h2>
        <p className="mt-2 text-sm text-slate-600">Explore more content.</p>
        <ul className="mt-4 space-y-2">
          {post.topic && (
            <>
              <li>
                <Link href={`/topics/${post.topic}`} className="text-sm text-sky-600 hover:underline">
                  Topics: {formatTopic(post.topic)}
                </Link>
              </li>
              <li>
                <Link href={`/ai-prompts-for/${post.topic}`} className="text-sm text-sky-600 hover:underline">
                  AI Prompts for {formatTopic(post.topic)}
                </Link>
              </li>
              <li>
                <Link href={`/how-to/${post.topic}`} className="text-sm text-sky-600 hover:underline">
                  How to {formatTopic(post.topic)}
                </Link>
              </li>
            </>
          )}
          <li>
            <Link href={`/creators/${username}`} className="text-sm text-sky-600 hover:underline">
              More from {author?.display_name || username}
            </Link>
          </li>
          <li>
            <Link href="/community" className="text-sm text-sky-600 hover:underline">
              Community feed
            </Link>
          </li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/community" className="text-sm font-medium text-sky-600 hover:underline">
          Community
        </Link>
        <Link href={`/creators/${username}`} className="text-sm font-medium text-sky-600 hover:underline">
          Author
        </Link>
        <Link href="/topics" className="text-sm font-medium text-sky-600 hover:underline">
          Topics
        </Link>
      </div>
    </article>
  );
}
