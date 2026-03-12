"use client";

import { useState } from "react";
import Link from "next/link";

export const metadata = {
  title: "TikTok Caption Generator",
  description:
    "Generate scroll-stopping TikTok captions from a simple video idea, complete with emojis and hashtags."
};

export default function TikTokCaptionGeneratorPage() {
  const [idea, setIdea] = useState("");
  const [caption, setCaption] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function generateCaption() {
    const trimmed = idea.trim();
    if (!trimmed) {
      setCaption(
        "Type a short idea for your TikTok above and I’ll suggest a caption you can paste straight into the app."
      );
      return;
    }

    setIsGenerating(true);

    const hooks = [
      "You need to see this 👇",
      "Nobody is talking about this…",
      "POV:",
      "If you’re a creator, save this:",
      "Stop scrolling for a sec 👇",
      "Creators, read this:"
    ];

    const emojis = ["✨", "🔥", "🚀", "🎯", "📲", "🎥", "💡", "📌", "🤯"];
    const tags = [
      "#tiktoktips",
      "#creators",
      "#contentcreator",
      "#learnontiktok",
      "#fyp",
      "#viral",
      "#tooleagle"
    ];

    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    const emojiTrail = emojis.sort(() => 0.5 - Math.random()).slice(0, 3).join(" ");
    const hashtagBlock = tags.sort(() => 0.5 - Math.random()).slice(0, 4).join(" ");

    const generated = `${hook} ${trimmed}\n\n${emojiTrail}\n${hashtagBlock}`;

    setTimeout(() => {
      setCaption(generated);
      setIsGenerating(false);
    }, 250);
  }

  async function handleCopy() {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      alert("Caption copied. Paste it into TikTok, Instagram or Shorts.");
    } catch {
      alert("Could not copy automatically. Please select the text and copy it manually.");
    }
  }

  const shareOnXUrl = caption
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`
    : undefined;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 flex items-center justify-center text-xs font-semibold shadow-lg shadow-cyan-500/40">
              TE
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ToolEagle</p>
              <p className="text-xs text-slate-400">Free Tools for Creators</p>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-3 text-xs text-slate-300">
            <Link
              href="/tools"
              className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/70 hover:border-sky-500/70 hover:text-sky-200 transition"
            >
              All tools
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-10 pb-16">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              Tool #1
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              TikTok Caption Generator
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Turn a quick idea into a ready-to-post TikTok caption with hooks, emojis and hashtags.
              Built for creators who want to move fast without overthinking the text.
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 sm:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-200">
                  Your video idea or hook
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="w-full min-h-[110px] resize-none rounded-2xl border border-slate-800 bg-slate-950/70 px-3.5 py-3 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
                  placeholder="Example: Share a 10-second tip that shows how to make vertical videos look more cinematic using just your phone."
                />

                <button
                  type="button"
                  onClick={generateCaption}
                  disabled={isGenerating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isGenerating ? "Crafting your caption…" : "Generate TikTok Caption"}
                </button>
              </div>

              <div className="mt-5 border-t border-slate-800/80 pt-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-300">Preview</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!caption}
                      className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500/80 hover:text-sky-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      Copy caption
                    </button>
                    {shareOnXUrl && (
                      <a
                        href={shareOnXUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500/80 hover:text-sky-200 transition"
                      >
                        Share on X
                      </a>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3.5 py-3 text-sm text-slate-100 whitespace-pre-line min-h-[80px]">
                  {caption ??
                    "Your caption will appear here. Once you’re happy, copy it and paste into TikTok, Instagram Reels or YouTube Shorts."}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-3.5 py-3">
                <p className="text-xs font-semibold text-slate-200">Pro tips</p>
                <ul className="mt-1.5 space-y-1.5 text-[11px] text-slate-400">
                  <li>Make the first line feel like you; that’s what stops the scroll.</li>
                  <li>Keep it under 2–3 short lines so it doesn’t get cut off.</li>
                  <li>Swap in 1–2 of your own branded hashtags to build your niche.</li>
                </ul>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  ToolEagle mission
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  ToolEagle exists to give every creator free, focused tools that remove friction
                  between ideas and published work. No logins, no noise—just what you need.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Share your results
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Paste your caption into TikTok, Instagram or Shorts, post your video, and share
                  ToolEagle with another creator who could use faster workflows.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                  <a
                    href="https://www.tiktok.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-3 py-1 hover:border-sky-500/80 hover:text-sky-200 transition"
                  >
                    Open TikTok
                  </a>
                  <a
                    href="https://www.instagram.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-3 py-1 hover:border-pink-500/80 hover:text-pink-200 transition"
                  >
                    Open Instagram
                  </a>
                  <a
                    href="https://www.youtube.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-700 px-3 py-1 hover:border-red-500/80 hover:text-red-200 transition"
                  >
                    Open YouTube
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-900/80 bg-slate-950/90">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} ToolEagle. Built for creators.
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <a
              href="https://www.tiktok.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-sky-300"
            >
              TikTok
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-pink-300"
            >
              Instagram
            </a>
            <a
              href="https://x.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-sky-300"
            >
              X
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

