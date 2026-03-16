import Link from "next/link";
import { formatTopicLabel } from "@/config/traffic-topics";
import { getAllGuideParams } from "@/config/traffic-topics";
import type { GuidePageType } from "@/config/traffic-topics";

type Props = { pageType: GuidePageType; topic: string };

const BASE_PATHS: Record<GuidePageType, string> = {
  "how-to": "/how-to",
  "ai-prompts": "/ai-prompts-for",
  "content-strategy": "/content-strategy",
  "viral-examples": "/viral-examples"
};

export function GuideRecommendations({ pageType, topic }: Props) {
  const allParams = getAllGuideParams();
  const related = allParams
    .filter(
      (p) =>
        (p.pageType === pageType && p.topic !== topic) ||
        (p.topic === topic && p.pageType !== pageType)
    )
    .slice(0, 8);

  if (related.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-slate-900">
        Related guides
      </h2>
      <ul className="mt-3 space-y-2">
        {related.map(({ pageType: pt, topic: t }) => (
          <li key={`${pt}-${t}`}>
            <Link
              href={`${BASE_PATHS[pt]}/${t}`}
              className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
            >
              {pt === "how-to" && `How to ${formatTopicLabel(t)}`}
              {pt === "ai-prompts" && `AI Prompts for ${formatTopicLabel(t)}`}
              {pt === "content-strategy" && `Content Strategy for ${formatTopicLabel(t)}`}
              {pt === "viral-examples" && `Viral ${formatTopicLabel(t)} Examples`}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
