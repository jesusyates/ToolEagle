/**
 * v62: 相关推荐 section - 10-15 links (same platform, same goal, trending)
 */
import Link from "next/link";
import { getRelatedRecommendations } from "@/lib/zh-keyword-data";

type Props = {
  context?: { platform?: string; goal?: string; excludeSlug?: string };
  limit?: number;
};

export function ZhRelatedRecommendations({ context, limit = 15 }: Props) {
  const links = getRelatedRecommendations(context, limit);
  if (links.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-slate-900">相关推荐</h2>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sky-700 hover:text-sky-800 hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
