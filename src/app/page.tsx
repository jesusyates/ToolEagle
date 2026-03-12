"use client";

import { useState } from "react";

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [caption, setCaption] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function generateCaption() {
    const trimmed = idea.trim();
    if (!trimmed) {
      setCaption("Share a quick idea or hook above and I’ll turn it into a TikTok-ready caption.");
      return;
    }

    setIsGenerating(true);

    // Simple, local "generation" to avoid needing any backend.
    const hooks = [
      "You need to see this 👇",
      "Nobody is talking about this…",
      "POV:",
      "Low effort, high impact tip:",
      "Stop scrolling for a sec 👇",
      "Creators, read this:"
    ];

    const emojis = ["✨", "🔥", "🚀", "🎯", "📲", "🎥", "💡"];
    const tags = [
      "#tiktoktips",
      "#creators",
      "#contentcreator",
      "#learnontiktok",
      "#fyp",
      "#viral",
      "#toolseagle"
    ];

    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    const emojiTrail = emojis.sort(() => 0.5 - Math.random()).slice(0, 3).join(" ");
    const hashtagBlock = tags.sort(() => 0.5 - Math.random()).slice(0, 4).join(" ");

    const generated = `${hook} ${trimmed}\n\n${emojiTrail}\n${hashtagBlock}`;

    // Tiny delay just to make the UI feel responsive and intentional.
    setTimeout(() => {
      setCaption(generated);
      setIsGenerating(false);
    }, 250);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 flex items-center justify-center text-xs font-semibold shadow-lg shadow-cyan-500/40">
              TE
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ToolEagle</p>
              <p className="text-xs text-slate-400">Free Tools for Creators</p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-4 text-sm text-slate-300">
            <span className="px-2 py-1 rounded-full bg-slate-900/70 border border-slate-800/70">
              TikTok Caption Generator
            </span>
          </nav>
        </div>
      </header>

      <div className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-10 pb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 shadow-sm shadow-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                First tool is live
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
                  ToolEagle
                </h1>
                <p className="text-lg text-slate-300">
                  <span className="font-medium text-sky-300">
                    Free Tools for Creators.
                  </span>{" "}
                  Ship content faster with simple, focused utilities built just for you.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm font-medium text-slate-200">
                    No sign‑up
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Open the site, use the tool, keep creating.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm font-medium text-slate-200">
                    Creator‑first
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Designed for TikTok, Reels, Shorts and more.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm font-medium text-slate-200">
                    Always free
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Start with captions, add more tools over time.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 sm:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
              <h2 className="text-base font-semibold text-slate-100 flex items-center justify-between gap-2">
                TikTok Caption Generator
                <span className="text-[11px] rounded-full bg-slate-800 px-2 py-0.5 text-slate-300 border border-slate-700/80">
                  Tool #1
                </span>
              </h2>
              <p className="mt-1.5 text-xs text-slate-400">
                Describe your video in a sentence. Get a scroll‑stopping caption back.
              </p>

              <div className="mt-4 space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Your video idea or hook
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="w-full min-h-[90px] resize-none rounded-2xl border border-slate-800 bg-slate-950/70 px-3.5 py-3 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
                  placeholder="Example: Show a before/after of my desk setup and share 3 tips to make small spaces feel bigger."
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

              <div className="mt-5 border-t border-slate-800/80 pt-4">
                <p className="text-xs font-medium text-slate-300 mb-1.5">
                  Result
                </p>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3.5 py-3 text-sm text-slate-100 whitespace-pre-line min-h-[64px]">
                  {caption ?? "Your caption will appear here. Paste it straight into TikTok once you’re happy with it."}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Pro tip: tweak the first line to sound exactly like you, then keep the emojis and hashtags.
                </p>
              </div>
            </div>
          </div>

          <section className="mt-14 border-t border-slate-900/80 pt-8">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
              Tools
            </h3>
            <p className="mt-1.5 text-xs text-slate-400">
              ToolEagle will grow over time. Today, start with the TikTok Caption Generator.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4">
                <p className="text-xs font-semibold text-sky-200 uppercase tracking-wide">
                  Live
                </p>
                <h4 className="mt-1 text-sm font-semibold text-slate-50">
                  TikTok Caption Generator
                </h4>
                <p className="mt-1.5 text-xs text-slate-200">
                  Turn a simple idea into a ready‑to‑post TikTok caption, complete with emojis and hashtags.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 opacity-70">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Coming soon
                </p>
                <h4 className="mt-1 text-sm font-semibold text-slate-100">
                  Hook & Intro Generator
                </h4>
                <p className="mt-1.5 text-xs text-slate-400">
                  Craft hooks for TikTok, Reels, Shorts and carousels in seconds.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 opacity-70">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Coming soon
                </p>
                <h4 className="mt-1 text-sm font-semibold text-slate-100">
                  Content Idea Bank
                </h4>
                <p className="mt-1.5 text-xs text-slate-400">
                  Save and recycle content ideas so you never run out on posting days.
                </p>
              </article>
            </div>
          </section>
        </section>
      </div>

      <footer className="border-t border-slate-900/80 bg-slate-950/90">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} ToolEagle. Built for creators.
          </p>
          <p className="text-[11px] text-slate-500">
            More small, focused tools coming soon.
          </p>
        </div>
      </footer>
    </main>
  );
}

