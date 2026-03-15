"use client";

import { useState } from "react";
import Link from "next/link";
import { DelegatedButton } from "@/components/DelegatedButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { getTwitterShareUrl, getRedditShareUrl, getLinkedInShareUrl } from "@/lib/share";

const BASE_URL = "https://www.tooleagle.com";

function generateTwitterPost(content: string, pageUrl?: string): string {
  const preview = content.slice(0, 200).trim();
  const text = preview.length < content.length ? `${preview}…` : preview;
  return pageUrl ? `${text}\n\n${pageUrl}` : text;
}

function generateRedditTitle(content: string): string {
  const firstLine = content.split("\n")[0]?.slice(0, 150) ?? content.slice(0, 150);
  return `${firstLine}${firstLine.length >= 150 ? "…" : ""} | Creator content from ToolEagle`;
}

function generateRedditPostText(content: string, pageUrl: string): string {
  return `Creator content from ToolEagle:\n\n${content}\n\nSource: ${pageUrl}`;
}

function generateLinkedInPost(content: string, pageUrl: string): string {
  const preview = content.slice(0, 500);
  return `${preview}${preview.length < content.length ? "…" : ""}\n\nShared via ToolEagle: ${pageUrl}`;
}

export function CreatorShareClient() {
  const [exampleContent, setExampleContent] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const twitterText = generateTwitterPost(exampleContent, pageUrl || undefined);
  const redditTitle = generateRedditTitle(exampleContent);
  const redditPostText = pageUrl
    ? generateRedditPostText(exampleContent, pageUrl)
    : generateRedditPostText(exampleContent, BASE_URL);
  const linkedInPost = generateLinkedInPost(exampleContent, pageUrl || BASE_URL);

  const twitterShareUrl = getTwitterShareUrl(twitterText);
  const redditShareUrl = getRedditShareUrl(pageUrl || BASE_URL, redditTitle);
  const linkedInShareUrl = getLinkedInShareUrl(pageUrl || BASE_URL);

  async function handleCopy(text: string, key: string) {
    const ok = await safeCopyToClipboard(text);
    if (ok) {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  const btnClass =
    "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition";
  const cardClass = "rounded-xl border border-slate-200 bg-white p-5";

  return (
    <div className="max-w-2xl space-y-8">
      <div className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Your content</h2>
        <textarea
          value={exampleContent}
          onChange={(e) => setExampleContent(e.target.value)}
          placeholder="Paste your caption, hook, or example content here..."
          className="mt-3 w-full min-h-[120px] rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          rows={4}
        />
        <input
          type="url"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          placeholder="Optional: Page URL (e.g. https://www.tooleagle.com/examples/xyz)"
          className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>

      {exampleContent.trim() && (
        <>
          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-900">Twitter post</h2>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded-lg">
              {twitterText}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <DelegatedButton
                onClick={() => handleCopy(twitterText, "twitter")}
                className={btnClass}
              >
                {copied === "twitter" ? "Copied!" : "Copy post"}
              </DelegatedButton>
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={btnClass}
              >
                Share to Twitter
              </a>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-900">Reddit post</h2>
            <p className="mt-2 text-xs font-medium text-slate-500">Title:</p>
            <p className="mt-1 text-sm text-slate-700">{redditTitle}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">Post text:</p>
            <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded-lg">
              {redditPostText}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <DelegatedButton
                onClick={() => handleCopy(redditPostText, "reddit")}
                className={btnClass}
              >
                {copied === "reddit" ? "Copied!" : "Copy post"}
              </DelegatedButton>
              <a
                href={redditShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={btnClass}
              >
                Share to Reddit
              </a>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-lg font-semibold text-slate-900">LinkedIn post</h2>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded-lg">
              {linkedInPost}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <DelegatedButton
                onClick={() => handleCopy(linkedInPost, "linkedin")}
                className={btnClass}
              >
                {copied === "linkedin" ? "Copied!" : "Copy post"}
              </DelegatedButton>
              <a
                href={linkedInShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={btnClass}
              >
                Share to LinkedIn
              </a>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-4">
        <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
          Creator Examples →
        </Link>
        <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
          AI Tools →
        </Link>
      </div>
    </div>
  );
}
