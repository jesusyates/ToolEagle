"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

type Props = {
  content: string;
  toolSlug: string;
  toolName: string;
};

export function RemixButton({ content, toolSlug, toolName }: Props) {
  const prompt = encodeURIComponent(
    `Generate something similar to: ${content.slice(0, 200)}${content.length > 200 ? "..." : ""}`
  );
  const href = `/tools/${toolSlug}?prompt=${prompt}`;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition"
    >
      <Sparkles className="h-4 w-4" />
      Remix with AI
    </Link>
  );
}
