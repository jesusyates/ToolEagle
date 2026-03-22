import { BASE_URL } from "@/config/site";
import type { ProgrammaticPageType, PseoLocale } from "@/lib/programmatic-seo";
import { pathForProgrammaticPage, slugToTitle } from "@/lib/programmatic-seo";

type Props = {
  pageType: ProgrammaticPageType;
  slug: string;
  keyword: string;
  locale: PseoLocale;
};

export function PseoJsonLd({ pageType, slug, keyword, locale }: Props) {
  const path = pathForProgrammaticPage(pageType, slug, locale);
  const url = `${BASE_URL}${path}`;
  const name = keyword.trim() || slugToTitle(slug);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${BASE_URL}/tools` },
      { "@type": "ListItem", position: 3, name: name, item: url }
    ]
  };

  let extra: object;
  if (pageType === "how_to") {
    extra = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to ${name}`,
      description: `Step-oriented guide for ${name} with ToolEagle prompts and tools.`,
      step: [
        { "@type": "HowToStep", name: "Clarify intent", text: `Define your audience and platform for ${name}.` },
        { "@type": "HowToStep", name: "Draft with prompts", text: `Use the on-page prompts to generate hooks and outlines for ${name}.` },
        { "@type": "HowToStep", name: "Publish & iterate", text: "Post, measure engagement, and refine with ToolEagle generators." }
      ]
    };
  } else {
    extra = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is the best way to start with ${name}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Start with one clear hook and a single CTA, then expand using the examples and prompts on this ToolEagle page.`
          }
        },
        {
          "@type": "Question",
          name: `Can I use these ${name} templates on multiple platforms?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Yes — adapt length and tone for TikTok, Reels, Shorts, or blogs while keeping the same structure.`
          }
        },
        {
          "@type": "Question",
          name: "Does ToolEagle require sign-up for core generators?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Many ToolEagle flows work without sign-up; upgrade unlocks workflow features."
          }
        }
      ]
    };
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(extra) }} />
    </>
  );
}
