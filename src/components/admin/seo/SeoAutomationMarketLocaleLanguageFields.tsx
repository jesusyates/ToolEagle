"use client";

import {
  SEO_AUTOMATION_LANGUAGE_OPTIONS,
  SEO_AUTOMATION_LOCALE_OPTIONS,
  SEO_AUTOMATION_MARKET_OPTIONS,
  suggestLocaleForContentLanguage
} from "@/lib/seo-ui/seo-automation-select-options";

export type SeoAutomationFieldLabels = {
  market: string;
  locale: string;
  contentLanguage: string;
};

type Props = {
  market: string;
  setMarket: (v: string) => void;
  locale: string;
  setLocale: (v: string) => void;
  contentLanguage: string;
  setContentLanguage: (v: string) => void;
  labels?: Partial<SeoAutomationFieldLabels>;
  labelClassName?: string;
  selectClassName?: string;
};

const defaultLabels: SeoAutomationFieldLabels = {
  market: "国家",
  locale: "站点区域",
  contentLanguage: "内容语言"
};

export function SeoAutomationMarketLocaleLanguageFields({
  market,
  setMarket,
  locale,
  setLocale,
  contentLanguage,
  setContentLanguage,
  labels: labelOverrides,
  labelClassName = "block text-slate-700",
  selectClassName = "mt-1 w-full rounded border border-slate-300 px-2 py-1"
}: Props) {
  const labels = { ...defaultLabels, ...labelOverrides };

  return (
    <>
      <div>
        <label className={labelClassName}>{labels.market}</label>
        <select value={market} onChange={(e) => setMarket(e.target.value)} className={selectClassName}>
          {SEO_AUTOMATION_MARKET_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClassName}>{labels.locale}</label>
        <select value={locale} onChange={(e) => setLocale(e.target.value)} className={selectClassName}>
          {SEO_AUTOMATION_LOCALE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClassName}>{labels.contentLanguage}</label>
        <select
          value={contentLanguage}
          onChange={(e) => {
            const v = e.target.value;
            setContentLanguage(v);
            setLocale(suggestLocaleForContentLanguage(v));
          }}
          className={selectClassName}
        >
          {SEO_AUTOMATION_LANGUAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
