import Link from "next/link";
import { topics, formatTopicLabel } from "@/config/seo/topics";

type RelatedTopicsProps = {
  platform: string;
  type: string;
  currentTopic: string;
  platformLabel: string;
  typeLabel: string;
  count?: number;
};

function pickRelated(currentTopic: string, count: number): string[] {
  const idx = topics.indexOf(currentTopic as (typeof topics)[number]);
  const others = topics.filter((t) => t !== currentTopic);
  if (idx < 0) return others.slice(0, count);
  const result: string[] = [];
  for (let i = 1; i <= count; i++) {
    const j = (idx + i) % topics.length;
    if (topics[j] !== currentTopic && !result.includes(topics[j])) {
      result.push(topics[j]);
    }
  }
  return result.slice(0, count);
}

export function RelatedTopics({
  platform,
  type,
  currentTopic,
  platformLabel,
  typeLabel,
  count = 5
}: RelatedTopicsProps) {
  const selected = pickRelated(currentTopic, Math.min(count, 6));

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-slate-900">Related Topics</h2>
      <p className="mt-1 text-sm text-slate-600">
        Explore more {platformLabel} {typeLabel.toLowerCase()} by topic.
      </p>
      <ul className="mt-3 space-y-2">
        {selected.map((t) => (
          <li key={t}>
            <Link
              href={`/${platform}/${type}/${t}`}
              className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
            >
              {formatTopicLabel(t)} {platformLabel} {typeLabel}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
