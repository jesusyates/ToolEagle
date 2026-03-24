"use client";

import { useTranslations } from "next-intl";

/**
 * V109.3 — Static sample outputs (trust), not interactive demos
 * V109.7 — Copy via i18n
 */
const EXAMPLES: { hook: string; caption: string; script: string }[] = [
  {
    hook: "Stop scrolling if you post short-form but your hooks still sound generic.",
    caption:
      "You need to see this 👇\n\n3-second hook + one line payoff + CTA in the caption. Save this for your next post.\n\n✨ #creators #shorts",
    script: "[0:00–0:03] HOOK — pattern interrupt\n[0:03–0:15] VALUE — one tip\n[0:15–0:20] CTA — comment keyword"
  },
  {
    hook: "POV: your video is good but the first line is invisible.",
    caption:
      "Nobody is talking about this…\n\nRewrite your first line like a headline, not a greeting.\n\n📲 #creator #tooleagle #shorts",
    script: "[Hook] Bold claim\n[Body] Proof / step\n[Close] Ask for saves"
  }
];

export function HomeExampleOutputs() {
  const t = useTranslations("home");
  return (
    <section className="container py-10 border-t border-slate-200" aria-labelledby="home-examples-heading">
      <h2 id="home-examples-heading" className="text-xl sm:text-2xl font-semibold text-slate-900">
        {t("examplesHeading")}
      </h2>
      <p className="mt-1 text-sm text-slate-600 max-w-2xl">{t("examplesSubtitle")}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {EXAMPLES.map((ex, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("examplesHookLabel")}</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{ex.hook}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("examplesCaptionLabel")}</p>
            <p className="mt-1 text-sm text-slate-800 whitespace-pre-line leading-relaxed">{ex.caption}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{t("examplesScriptLabel")}</p>
            <p className="mt-1 text-sm text-slate-700 whitespace-pre-line font-mono text-[13px] leading-relaxed">
              {ex.script}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
