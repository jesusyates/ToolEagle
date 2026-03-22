"use client";

import { ReactNode } from "react";
import { PostPackageToolClient } from "@/components/tools/PostPackageToolClient";

type Props = { relatedAside?: ReactNode };

export function TikTokCaptionGeneratorClient({ relatedAside }: Props) {
  return (
    <PostPackageToolClient
      toolSlug="tiktok-caption-generator"
      toolKind="tiktok_caption"
      eyebrow="Tool #1 · V95"
      title="TikTok Caption Generator"
      description="Turn a video idea into a publish-ready package: hook, talking points, caption, CTA, hashtags, why it works, and posting tips — not just one line of text."
      tryExample="A video about a morning productivity routine"
      inputLabel="Video idea"
      placeholder="Example: A 15s tip that shows how I batch-film 5 Reels in one hour."
      generateButtonLabel="Generate post packages"
      resultTitle="Your post packages"
      emptyMessage="Enter your idea above to get structured packages you can film and paste straight into TikTok."
      howItWorksSteps={[
        { step: 1, text: "Describe your video idea or topic in one short paragraph." },
        { step: 2, text: "Generate — each package includes hook, script beats, caption, CTA, tags, and strategy." },
        { step: 3, text: "Copy blocks into TikTok (or Reels/Shorts) and tweak with your voice." }
      ]}
      proTips={[
        "Regenerate when you want a different hook pattern — keep your topic the same.",
        "Film to the talking points first; the caption becomes easy once the take is done.",
        "Pro unlocks fuller strategy text and more variants per run."
      ]}
      examplesCategory="tiktok_caption"
      valueProofVariant="caption"
      relatedAside={relatedAside}
    />
  );
}
