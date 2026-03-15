import Link from "next/link";
import { getFeaturedAnswerLinks } from "@/config/answers-links";

export function BlogAnswerLinks() {
  const links = getFeaturedAnswerLinks(5);
  if (links.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-slate-900">Related Answers</h2>
      <p className="mt-1 text-sm text-slate-600">
        Quick guides on how to write captions, hooks, and titles.
      </p>
      <ul className="mt-3 space-y-2">
        {links.map(({ slug, title }) => (
          <li key={slug}>
            <Link
              href={`/answers/${slug}`}
              className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
            >
              {title}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-4">
        <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
          All answers →
        </Link>
        <Link href="/questions" className="text-sm font-medium text-sky-600 hover:underline">
          Creator Questions →
        </Link>
        <Link href="/trending" className="text-sm font-medium text-sky-600 hover:underline">
          Trending content →
        </Link>
        <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
          Creator Examples →
        </Link>
      </div>
    </section>
  );
}
