"use client";

import Link from "next/link";
import { SaveButton } from "./SaveButton";
import { ContentSaveButton } from "./ContentSaveButton";
import { ToolCopyButton } from "../tools/ToolCopyButton";
import { safeCopyToClipboard } from "@/lib/clipboard";

type Props = {
  slug: string | null;
  result: string;
  toolName: string;
  toolSlug: string;
  creatorUsername: string | null;
  itemType: "caption" | "hook";
};

export function LibraryExampleCard({
  slug,
  result,
  toolName,
  toolSlug,
  creatorUsername,
  itemType
}: Props) {

  return (
    <div className="rounded-lg border border-slate-200 px-4 py-3 hover:border-sky-300 transition group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {slug ? (
            <Link href={`/examples/${slug}`} className="block">
              <p className="text-sm text-slate-800 line-clamp-2">{result}</p>
            </Link>
          ) : (
            <p className="text-sm text-slate-800 line-clamp-2">{result}</p>
          )}
          {creatorUsername && (
            <span className="mt-1 text-xs text-slate-500">@{creatorUsername}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
          <ToolCopyButton
            onClick={async () => { await safeCopyToClipboard(result); }}
            variant="default"
            getTextToCopy={() => result}
          />
          {slug ? (
            <SaveButton exampleSlug={slug} content={result} variant="icon" />
          ) : (
            <ContentSaveButton
              itemType={itemType}
              toolSlug={toolSlug}
              toolName={toolName}
              content={result}
              variant="icon"
            />
          )}
        </div>
      </div>
    </div>
  );
}
