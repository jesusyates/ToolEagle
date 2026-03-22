/**
 * V80: EN Author Block - same authority as ZhAuthorBlock
 */

import { BASE_URL } from "@/config/site";

const PERSON_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ToolEagle AI Team",
  description: "AI Content Growth Experts. 5+ years in AI content and social growth. Specialization: TikTok, YouTube, Instagram growth.",
  url: BASE_URL,
  sameAs: [
    "https://www.tooleagle.com",
    "https://twitter.com/tooleagle",
    "https://github.com/tooleagle"
  ].filter(Boolean)
};

export function EnAuthorBlock() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_SCHEMA) }}
      />
      <section
        className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-5"
        aria-label="Author"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-700 text-lg font-bold text-white">
            T
          </div>
          <div>
            <p className="font-semibold text-slate-900">By: ToolEagle AI Team</p>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              AI Content Growth Experts. 5+ years in AI content and social growth. Specialization: TikTok, YouTube, Instagram growth.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
