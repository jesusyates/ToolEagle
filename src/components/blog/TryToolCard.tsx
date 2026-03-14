import Link from "next/link";
import { tools } from "@/config/tools";

const TAG_TO_SLUG: Record<string, string> = {
  tiktok: "tiktok-caption-generator",
  captions: "tiktok-caption-generator",
  ideas: "tiktok-idea-generator",
  hashtags: "hashtag-generator",
  instagram: "instagram-caption-generator",
  reels: "reel-caption-generator",
  hooks: "hook-generator",
  viral: "viral-hook-generator",
  strategy: "hook-generator",
  youtube: "youtube-title-generator",
  titles: "title-generator",
  formulas: "title-generator",
  bios: "tiktok-bio-generator",
  usernames: "tiktok-username-generator",
  descriptions: "youtube-description-generator",
  scripts: "tiktok-script-generator",
  story: "story-hook-generator",
  clickbait: "clickbait-title-generator",
  ai: "ai-video-title-generator",
  shorts: "shorts-title-generator"
};

function getRecommendedToolSlug(tags: string[] = []): string {
  const lower = tags.map((t) => t.toLowerCase());
  for (const tag of lower) {
    const slug = TAG_TO_SLUG[tag];
    if (slug) return slug;
  }
  return "tiktok-caption-generator";
}

type TryToolCardProps = {
  tags?: string[];
};

export function TryToolCard({ tags = [] }: TryToolCardProps) {
  const slug = getRecommendedToolSlug(tags);
  const tool = tools.find((t) => t.slug === slug) ?? tools[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm hover:shadow-md transition duration-150">
      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
        Try the tool
      </p>
      <h3 className="mt-2 text-base font-semibold text-slate-900">
        {tool.name}
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        {tool.description}
      </p>
      <Link
        href={`/tools/${tool.slug}`}
        className="mt-4 inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition duration-150"
      >
        Open tool
      </Link>
    </div>
  );
}
