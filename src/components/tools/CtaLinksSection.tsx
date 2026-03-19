"use client";

import { useTranslations } from "next-intl";

type Props = {
  links: { href: string; label: string }[];
};

export function CtaLinksSection({ links }: Props) {
  const t = useTranslations("toolPages");
  if (links.length === 0) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-lg font-semibold text-slate-900">{t("learnMore")}</h2>
      <p className="mt-2 text-sm text-slate-600">{t("learnMoreDesc")}</p>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="text-sky-700 hover:text-sky-800 hover:underline">
              {link.label}{t("ctaLinkSuffix")}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
