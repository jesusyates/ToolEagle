"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { DelegatedButton } from "@/components/DelegatedButton";
import { LimitReachedModal } from "@/components/LimitReachedModal";

const PLATFORMS = ["TikTok", "YouTube", "Instagram", "Reels", "Shorts"];
const TONES = ["funny", "professional", "casual", "inspirational", "educational"];

type CreatorOutput = {
  hook: string;
  caption: string;
  hashtags: string[];
  videoIdea: string;
};

export default function CreatorPage() {
  const t = useTranslations("home");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [tone, setTone] = useState("casual");
  const [output, setOutput] = useState<CreatorOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  async function handleGenerate() {
    const trimmed = topic.trim();
    if (!trimmed) return;

    setIsGenerating(true);
    setOutput(null);

    try {
      const res = await fetch("/api/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topic: trimmed, platform, tone })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.limitReached) {
          setLimitModalOpen(true);
        }
        return;
      }

      setOutput({
        hook: data.hook ?? "",
        caption: data.caption ?? "",
        hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
        videoIdea: data.videoIdea ?? ""
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function updateField<K extends keyof CreatorOutput>(key: K, value: CreatorOutput[K]) {
    if (!output) return;
    setOutput({ ...output, [key]: value });
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <LimitReachedModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              {t("creatorMode")}
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
              Generate full creator content
            </h1>
            <p className="text-slate-600 mt-2">
              Enter your topic, pick platform and tone, then get a hook, caption, hashtags and video
              idea—all editable.
            </p>
          </div>

          <div className="mt-8 max-w-2xl space-y-6">
            <ToolInputCard label="Topic">
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. morning routine for productivity"
                className="w-full min-h-[80px] rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
              />
            </ToolInputCard>

            <div className="grid gap-4 sm:grid-cols-2">
              <ToolInputCard label="Platform">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </ToolInputCard>
              <ToolInputCard label="Tone">
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </ToolInputCard>
            </div>

            <DelegatedButton
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full rounded-xl bg-slate-900 px-5 py-3.5 text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Generate content"
              )}
            </DelegatedButton>
          </div>

          {output && (
            <div className="mt-10 max-w-2xl space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Your content</h2>

              <ToolInputCard label="Hook">
                <textarea
                  value={output.hook}
                  onChange={(e) => updateField("hook", e.target.value)}
                  className="w-full min-h-[60px] rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                />
              </ToolInputCard>

              <ToolInputCard label="Caption">
                <textarea
                  value={output.caption}
                  onChange={(e) => updateField("caption", e.target.value)}
                  className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                />
              </ToolInputCard>

              <ToolInputCard label="Hashtags">
                <textarea
                  value={output.hashtags.join(" ")}
                  onChange={(e) =>
                    updateField(
                      "hashtags",
                      e.target.value
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((s) => (s.startsWith("#") ? s : `#${s}`))
                    )
                  }
                  placeholder="#tag1 #tag2 ..."
                  className="w-full min-h-[60px] rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                />
              </ToolInputCard>

              <ToolInputCard label="Video idea">
                <textarea
                  value={output.videoIdea}
                  onChange={(e) => updateField("videoIdea", e.target.value)}
                  className="w-full min-h-[80px] rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                />
              </ToolInputCard>
            </div>
          )}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
