"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { getHistory, type HistoryEntry } from "@/lib/storage";
import { ToolCopyButton } from "./ToolCopyButton";

const MAX_DISPLAY = 5;

export function HistoryPanel({ toolSlug, refreshTrigger }: { toolSlug: string; refreshTrigger?: number }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(getHistory().filter((h) => h.toolSlug === toolSlug).slice(0, MAX_DISPLAY));
  }, [toolSlug, refreshTrigger]);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">History</h3>
      </div>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="group rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 hover:border-slate-200 transition-colors"
          >
            <p className="text-xs text-slate-600 line-clamp-2 mb-2">{entry.input}</p>
            <div className="flex items-center gap-2">
              <ToolCopyButton
                onClick={async () => {
                  const text = entry.items.join("\n\n---\n\n");
                  await safeCopyToClipboard(text);
                }}
                variant="primary"
              />
              <Link
                href={`/tools/${toolSlug}`}
                className="text-xs font-medium text-sky-600 hover:underline"
              >
                Use again
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
