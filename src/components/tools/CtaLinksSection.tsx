"use client";

import { useTranslations } from "next-intl";

type Props = {
  links: { href: string; label: string }[];
  /** V97.1 — China tool sidebar without EN next-intl strings */
  variant?: "default" | "zh";
};

export function CtaLinksSection({ links, variant = "default" }: Props) {
  const t = useTranslations("toolPages");
  if (links.length === 0) return null;
  const zh = variant === "zh";
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-lg font-semibold text-slate-900">{zh ? "相关中文关键词页" : t("learnMore")}</h2>
      <p className="mt-2 text-sm text-slate-600">
        {zh ? "从这些页面继续拆选题、拆结构，全部留在中文站内。" : t("learnMoreDesc")}
      </p>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-sky-700 hover:text-sky-800 hover:underline">
              {link.label}
              {zh ? " →" : t("ctaLinkSuffix")}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
