"use client";

import { ReactNode } from "react";
import { PostPackageToolClient } from "@/components/tools/PostPackageToolClient";
import { getToolPageCopyEn } from "@/config/tool-page-copy-en";

type Props = { relatedAside?: ReactNode };

const TT = getToolPageCopyEn("tiktok-caption-generator")!;

export function TikTokCaptionGeneratorClient({ relatedAside }: Props) {
  return (
    <PostPackageToolClient
      toolSlug="tiktok-caption-generator"
      toolKind="tiktok_caption"
      eyebrow="Tool #1 · V95"
      title="TikTok Caption Generator"
      description={TT.hero}
      introProblem={TT.steps}
      introAudience=""
      tryExample="A video about a morning productivity routine"
      inputLabel="Video idea"
      placeholder="Example: a 15s morning routine for busy creators (show + tell)."
      generateButtonLabel="Start generating now"
      resultTitle="Your post packages"
      emptyMessage="Your TikTok-ready package will appear here. Copy each block, then paste into TikTok 'Describe your post'."
      howItWorksSteps={[
        { step: 1, text: "Describe your video idea: topic + who it’s for + what you want viewers to do." },
        { step: 2, text: "Tap Start generating, then pick the variant that matches your voice." },
        { step: 3, text: "Copy Hook + Script beats + Caption + CTA + Hashtags." },
        { step: 4, text: "In TikTok, paste into Describe your post → tap Post → check Profile." }
      ]}
      proTips={[
        "On mobile: use Copy all first, then paste everything into Describe your post.",
        "If your video has big on-screen text, keep the caption short and rely on CTA + hashtags.",
        "Run it two or three times and pick the variant that sounds most like you."
      ]}
      examplesCategory="tiktok_caption"
      valueProofVariant="caption"
      relatedAside={relatedAside}
      creatorKnowledgeEngine
      outputPreview={
        <div>
          <p className="font-semibold text-slate-900">Hook</p>
          <p className="mt-1 text-slate-800">“You’re doing this wrong—here’s the faster way to get results.”</p>
          <p className="mt-2 font-semibold text-slate-900">Script beats</p>
          <ul className="mt-1 list-disc pl-5 text-slate-800">
            <li>Setup: what people try first</li>
            <li>Proof: quick before/after moment</li>
            <li>Step: one actionable change</li>
            <li>CTA: comment your niche for a tailored version</li>
          </ul>
          <p className="mt-2 font-semibold text-slate-900">Caption + CTA + Hashtags</p>
          <p className="mt-1 text-slate-800">Hook line → 3–4 sentence body → CTA. #creators #shortformvideo #contentstrategy #tiktoktips</p>
        </div>
      }
    />
  );
}
