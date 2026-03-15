/**
 * Related internal links for SEO and navigation
 * Used across topics, examples, answers, library, captions, hooks
 */

import Link from "next/link";

export type RelatedLinksConfig = {
  topics?: boolean;
  examples?: boolean;
  answers?: boolean;
  library?: boolean;
  captions?: boolean;
  hooks?: boolean;
  trending?: boolean;
  tools?: boolean;
  leaderboard?: boolean;
  creators?: boolean;
};

const DEFAULT_LINKS: RelatedLinksConfig = {
  topics: true,
  examples: true,
  answers: true,
  library: true,
  captions: true,
  hooks: true,
  trending: true,
  tools: true
};

export function RelatedLinks(props: Partial<RelatedLinksConfig> = {}) {
  const config = { ...DEFAULT_LINKS, ...props };

  const links: { href: string; label: string }[] = [];

  if (config.topics) links.push({ href: "/topics", label: "Topics" });
  if (config.examples) links.push({ href: "/examples", label: "Creator Examples" });
  if (config.answers) links.push({ href: "/answers", label: "Answers" });
  if (config.library) links.push({ href: "/library", label: "Library" });
  if (config.captions) links.push({ href: "/captions", label: "Caption Ideas" });
  if (config.hooks) links.push({ href: "/hooks", label: "Hook Ideas" });
  if (config.trending) links.push({ href: "/trending", label: "Trending" });
  if (config.tools) links.push({ href: "/tools", label: "AI Tools" });
  if (config.leaderboard) links.push({ href: "/leaderboard", label: "Leaderboard" });
  if (config.creators) links.push({ href: "/creators", label: "Creators" });

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
        Related
      </h2>
      <div className="mt-2 flex flex-wrap gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-medium text-sky-600 hover:underline"
          >
            {l.label} →
          </Link>
        ))}
      </div>
    </section>
  );
}
