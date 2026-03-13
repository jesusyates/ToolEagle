"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { tools } from "@/config/tools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { ToolResultCard } from "@/components/tools/ToolResultCard";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";

const patterns = [
  "POV: {outcome} without {pain}",
  "You’re doing {topic} wrong, here’s why:",
  "Stop scrolling if you {identity}",
  "No one is talking about {secret}",
  "If you {identity}, watch this before {action}",
  "I tried {experiment} so you don’t have to"
];

export function HookGeneratorClient() {
  const [topic, setTopic] = useState("");
  const [hooks, setHooks] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const toolMeta = tools.find((t) => t.slug === "hook-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
  }, []);

  function generateHooks() {
    const trimmed = topic.trim();
    if (!trimmed) {
      setHooks([
        "Stop scrolling if you want your next video to do better than the last one.",
        "POV: your content is good, but your hook is invisible."
      ]);
      return;
    }

    setIsGenerating(true);

    const replacements = {
      "{outcome}": "getting " + trimmed,
      "{pain}": "burning out on content",
      "{topic}": trimmed,
      "{identity}": "post " + trimmed,
      "{secret}": trimmed + " growth",
      "{action}": "you post your next " + trimmed + " video",
      "{experiment}": trimmed + " hacks"
    };

    const generated = patterns.map((pattern) =>
      pattern.replace(/\{[^}]+\}/g, (match) => (replacements as any)[match] || trimmed)
    );

    setTimeout(() => {
      setHooks(generated.slice(0, 5));
      setIsGenerating(false);
      if (toolMeta) {
        trackEvent("tool_generate", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category
        });
      }
    }, 200);
  }

  function handleCopyAll() {
    if (!hooks || hooks.length === 0) return;
    const text = hooks.map((h, i) => `${i + 1}. ${h}`).join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (toolMeta) {
          trackEvent("tool_copy", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category
          });
        }
        alert("Hooks copied. Paste them into your notes or script doc.");
      })
      .catch(() => {
        alert("Could not copy automatically. Please select and copy manually.");
      });
  }

  return (
    <ToolPageShell
      eyebrow="Tool"
      title="Hook Generator"
      description="Generate punchy first lines for TikToks, Reels, Shorts and carousels so people stop and actually listen."
      input={
        <ToolInputCard label="What is this video/post about?">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            placeholder="Example: Instagram Reels for small business owners, showing how to turn one video into 5 posts."
          />
          <button
            type="button"
            onClick={generateHooks}
            disabled={isGenerating}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-75 transition"
          >
            {isGenerating ? "Generating hooks…" : "Generate Hooks"}
          </button>
        </ToolInputCard>
      }
      result={
        <ToolResultCard
          title="Hook ideas"
          actions={
            <ToolCopyButton
              label="Copy all hooks"
              onClick={handleCopyAll}
              disabled={!hooks || hooks.length === 0}
            />
          }
        >
          {hooks && hooks.length > 0 ? (
            hooks.map((hook, index) => `${index + 1}. ${hook}`).join("\n")
          ) : (
            "Your hook ideas will appear here. Keep them short enough to say in 2–3 seconds."
          )}
        </ToolResultCard>
      }
      proTips={
        <ToolProTipsCard
          tips={[
            "Say your hook out loud; if it’s hard to say, it’s hard to listen to.",
            "Record the hook twice: one calm, one high‑energy—test which performs better.",
            "Match the hook to the first frame visually so they feel like one idea."
          ]}
        />
      }
    />
  );
}

