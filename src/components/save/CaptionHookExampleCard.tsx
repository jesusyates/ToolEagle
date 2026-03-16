"use client";

import Link from "next/link";
import { SaveButton } from "./SaveButton";
import { ContentSaveButton } from "./ContentSaveButton";
import { ToolCopyButton } from "../tools/ToolCopyButton";
import { safeCopyToClipboard } from "@/lib/clipboard";

type Props = {
  text: string;
  slug?: string | null;
  toolSlug: string;
  toolName: string;
  itemType: "caption" | "hook";
  creatorUsername?: string | null;
};

export function CaptionHookExampleCard({
  text,
  slug,
  toolSlug,
  toolName,
  itemType,
  creatorUsername
}: Props) {
  return (
    <div className="rounded-lg border border-slate-200 px-4 py-3 hover:border-slate-300 transition group flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        {slug ? (
          <Link href={`/examples/${slug}`}>
            <p className="text-sm text-slate-800 line-clamp-3">{text}</p>
          </Link>
        ) : (
          <p className="text-sm text-slate-800 line-clamp-3">{text}</p>
        )}
        {creatorUsername && (
          <span className="mt-1 text-xs text-slate-500">@{creatorUsername}</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
        <ToolCopyButton
          onClick={async () => { await safeCopyToClipboard(text); }}
          variant="default"
          getTextToCopy={() => text}
        />
        {slug ? (
          <SaveButton exampleSlug={slug} content={text} variant="icon" />
        ) : (
          <ContentSaveButton
            itemType={itemType}
            toolSlug={toolSlug}
            toolName={toolName}
            content={text}
            variant="icon"
          />
        )}
      </div>
    </div>
  );
}
