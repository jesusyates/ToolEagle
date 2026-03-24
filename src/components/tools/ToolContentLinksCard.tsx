import { AnswerLinksCard } from "@/components/tools/AnswerLinksCard";

type ToolContentLinksCardProps = {
  toolSlug: string;
};

/** Backward-compatible alias used by tool pages. */
export function ToolContentLinksCard({ toolSlug }: ToolContentLinksCardProps) {
  return <AnswerLinksCard toolSlug={toolSlug} />;
}

