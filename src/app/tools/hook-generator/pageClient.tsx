"use client";

import { ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PostPackageToolClient } from "@/components/tools/PostPackageToolClient";
import { resolveToolPageCopy } from "@/config/tool-page-copy-resolve";

type Props = { relatedAside?: ReactNode; ctaLinks?: { href: string; label: string }[] };

export function HookGeneratorClient({ relatedAside, ctaLinks }: Props) {
  const tTool = useTranslations("toolPages");
  const tHook = useTranslations("toolPages.hookGenerator");
  const locale = useLocale();
  const copy = resolveToolPageCopy("hook-generator", locale);
  const description = copy?.hero ?? tHook("description");
  const introProblem = copy?.steps;
  const introAudience = copy?.steps ? "" : undefined;

  return (
    <PostPackageToolClient
      toolSlug="hook-generator"
      toolKind="hook_focus"
      eyebrow={tTool("eyebrow")}
      title={tHook("title")}
      description={description}
      introProblem={introProblem}
      introAudience={introAudience}
      tryExample="Instagram Reels for small business owners, showing how to turn one video into 5 posts."
      inputLabel={tHook("inputLabel")}
      placeholder={tHook("placeholder")}
      generateButtonLabel={tHook("generateButton")}
      resultTitle={tHook("resultTitle")}
      emptyMessage={tHook("emptyMessage")}
      howItWorksSteps={[
        { step: 1, text: tHook("howItWorks1") },
        { step: 2, text: tHook("howItWorks2") },
        { step: 3, text: tHook("howItWorks3") }
      ]}
      proTips={[tHook("proTip1"), tHook("proTip2"), tHook("proTip3")]}
      creatorKnowledgeEngine
      examplesCategory="hook"
      valueProofVariant="hook"
      relatedAside={relatedAside}
      ctaLinks={ctaLinks}
    />
  );
}
