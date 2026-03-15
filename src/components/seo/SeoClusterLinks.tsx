import Link from "next/link";
import { getBaseTopic, getIntent, INTENT_LABELS } from "@/config/seo/intents";
import { formatTopicLabel, topics } from "@/config/seo/topics";

/** Intents to show as cluster links (exclude questions for cluster) */
const CLUSTER_INTENTS = ["examples", "ideas", "templates", "guide"] as const;

type SeoClusterLinksProps = {
  platform: string;
  type: string;
  currentTopic: string;
  platformLabel: string;
  typeLabel: string;
};

const topicSet = new Set(topics);

export function SeoClusterLinks({
  platform,
  type,
  currentTopic,
  platformLabel,
  typeLabel
}: SeoClusterLinksProps) {
  const baseTopic = getBaseTopic(currentTopic);
  const currentIntent = getIntent(currentTopic);

  const links = CLUSTER_INTENTS
    .filter((intent) => intent !== currentIntent)
    .map((intent) => {
      const topicSlug = `${baseTopic}-${intent}`;
      const label = `${formatTopicLabel(baseTopic)} ${INTENT_LABELS[intent]}`;
      return { href: `/${platform}/${type}/${topicSlug}`, label, topicSlug };
    })
    .filter((l) => topicSet.has(l.topicSlug));

  if (links.length === 0) return null;

  return (
    <nav className="mb-8 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 mb-2">
        Explore more
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition"
          >
            {label} {platformLabel} {typeLabel}
          </Link>
        ))}
      </div>
    </nav>
  );
}
