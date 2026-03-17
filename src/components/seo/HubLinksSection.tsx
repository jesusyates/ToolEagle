/**
 * v60.1 - Hub links for platform pages
 * Force link to /how-to, /content-strategy, /viral-examples
 */
import Link from "next/link";
import { getHubLinks } from "@/config/core-pages-en";

type HubLinksSectionProps = {
  platform?: string;
};

export function HubLinksSection({ platform }: HubLinksSectionProps) {
  const hubs = getHubLinks();
  if (hubs.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-slate-900">Explore Guides</h2>
      <p className="mt-1 text-sm text-slate-600 mb-3">
        {platform
          ? `More ${platform.charAt(0).toUpperCase() + platform.slice(1)} guides and strategies.`
          : "How-to guides, content strategy, and viral examples."}
      </p>
      <div className="flex flex-wrap gap-3">
        {hubs.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
          >
            {label} →
          </Link>
        ))}
      </div>
    </section>
  );
}
