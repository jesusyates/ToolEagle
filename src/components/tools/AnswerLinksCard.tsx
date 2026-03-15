import Link from "next/link";
import { getAnswerPage, getAllAnswerSlugs } from "@/config/answers";

/** Map tool slug to relevant answer slugs */
const TOOL_TO_ANSWERS: Record<string, string[]> = {
  "tiktok-caption-generator": [
    "how-to-write-tiktok-captions",
    "tiktok-caption-length",
    "tiktok-viral-captions",
    "best-caption-length"
  ],
  "instagram-caption-generator": [
    "how-to-write-instagram-captions",
    "instagram-caption-length",
    "instagram-reel-captions",
    "best-caption-length"
  ],
  "hook-generator": [
    "how-to-write-youtube-hooks",
    "how-to-write-viral-hooks",
    "tiktok-hook-ideas",
    "youtube-shorts-hooks"
  ],
  "title-generator": ["youtube-title-tips", "best-caption-length"],
  "youtube-title-generator": ["youtube-title-tips", "youtube-ctr-titles"],
  "hashtag-generator": ["tiktok-hashtag-strategy", "instagram-hashtag-strategy"],
  "tiktok-bio-generator": ["tiktok-bio-tips"],
  "youtube-description-generator": ["youtube-description-seo"]
};

type AnswerLinksCardProps = {
  toolSlug: string;
  limit?: number;
};

export function AnswerLinksCard({ toolSlug, limit = 3 }: AnswerLinksCardProps) {
  const slugs = TOOL_TO_ANSWERS[toolSlug] ?? [];
  const allSlugs = getAllAnswerSlugs();
  const validSlugs = slugs.filter((s) => allSlugs.includes(s)).slice(0, limit);

  if (validSlugs.length === 0) return null;

  const links = validSlugs.map((slug) => {
    const page = getAnswerPage(slug);
    return { slug, title: page?.question ?? slug };
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
        Related answers
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Quick guides on captions, hooks, and titles.
      </p>
      <ul className="mt-3 space-y-2">
        {links.map(({ slug, title }) => (
          <li key={slug}>
            <Link
              href={`/answers/${slug}`}
              className="text-sm text-sky-600 hover:text-sky-700 hover:underline"
            >
              {title}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
          All answers →
        </Link>
        <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
          Trending →
        </Link>
        <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
          Examples →
        </Link>
      </div>
    </div>
  );
}
