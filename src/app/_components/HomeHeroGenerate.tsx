"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

const DEFAULT_HERO_BG = "/images/home-hero-en.png";

/**
 * English home hero — background full-bleed, copy in a centered column with readable scrim.
 * Mobile-first: no forced single-line body; CTAs full-width then row on sm+.
 */
export function HomeHeroGenerate() {
  const t = useTranslations("home");
  const envBg =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_HOME_HERO_BG_URL?.trim() : "";
  const bgSrc = envBg || DEFAULT_HERO_BG;

  return (
    <section
      className="relative flex min-h-[min(100svh,1227px)] flex-col justify-center overflow-hidden sm:min-h-[min(112svh,1653px)] sm:justify-center"
      aria-labelledby="home-hero-slogan"
    >
      <div className="pointer-events-none absolute inset-0 bg-[#030712]" aria-hidden />
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={bgSrc}
          alt=""
          fill
          priority
          quality={88}
          sizes="100vw"
          className="pointer-events-none object-cover object-[center_32%] sm:object-[center_58%]"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/50 to-slate-950/90"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_38%,rgba(2,6,23,0.55),transparent_70%)] sm:bg-[radial-gradient(ellipse_90%_65%_at_50%_42%,rgba(2,6,23,0.5),transparent_68%)]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[hsl(220_14%_96%)] via-[hsl(220_14%_96%)]/55 to-transparent sm:h-60 md:h-72"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pb-10 pt-8 sm:flex-none sm:px-6 sm:pb-28 sm:pt-20 md:pb-32 md:pt-24">
        <div className="mx-auto w-full max-w-[45rem] -translate-y-6 px-5 py-10 sm:max-w-[48rem] sm:-translate-y-10 sm:px-10 sm:py-[2.75rem] md:max-w-[53rem] md:-translate-y-12 md:py-12">
          <div className="flex flex-col items-center text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-cyan-100/95 sm:text-sm sm:tracking-[0.32em]">
              {t("heroEyebrow")}
            </p>

            <p className="mt-4 inline-flex max-w-full items-center rounded-full border border-white/20 bg-transparent px-3 py-1 text-[11px] font-medium leading-tight text-slate-100/95 [text-shadow:0_2px_18px_rgba(0,0,0,0.85)] sm:mt-5 sm:px-3.5 sm:text-xs">
              {t("heroTagline")}
            </p>

            <h1
              id="home-hero-slogan"
              className="mt-5 w-full font-sans text-[clamp(2.33rem,8.2vw,4.46rem)] font-bold leading-[1.12] tracking-[-0.035em] sm:mt-6 md:text-[clamp(3rem,6.4vw,5rem)]"
            >
              <span className="block bg-gradient-to-b from-[#fffef8] via-[#fef3c7] to-[#bae6fd] bg-clip-text text-transparent drop-shadow-[0_6px_40px_rgba(0,0,0,0.5)]">
                {t("heroSlogan")}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-pretty text-[1.25rem] font-medium leading-relaxed text-slate-100/95 [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] sm:mt-6 sm:max-w-2xl sm:text-lg md:text-xl">
              {t("heroIntro")}
            </p>

            <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:mt-9 sm:max-w-xl sm:flex-row sm:justify-center sm:gap-3 md:max-w-2xl">
              <Link
                href="/tools"
                className="inline-flex min-h-[3rem] w-full flex-1 items-center justify-center rounded-xl border border-amber-200/50 bg-gradient-to-b from-[#fcfaf6] to-[#f3ece3] px-5 text-[0.9375rem] font-semibold text-stone-900 shadow-[0_14px_36px_-14px_rgba(0,0,0,0.5)] transition duration-150 hover:border-amber-300/65 hover:brightness-[1.02] sm:min-h-[3.25rem] sm:max-w-[13rem] sm:text-base"
              >
                {t("heroPrimaryCta")}
              </Link>
              <Link
                href="/en/how-to"
                className="inline-flex min-h-[3rem] w-full flex-1 items-center justify-center rounded-xl border border-white/30 bg-transparent px-5 text-[0.9375rem] font-medium text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)] transition duration-150 hover:border-white/45 hover:bg-white/[0.06] sm:min-h-[3.25rem] sm:max-w-[13rem] sm:text-base"
              >
                {t("heroSecondaryCta")}
              </Link>
            </div>

            <p className="mt-7 text-center text-[11px] font-medium tabular-nums tracking-wide text-slate-300/95 [text-shadow:0_1px_14px_rgba(0,0,0,0.55)] sm:mt-8 sm:text-xs">
              {t("heroTrustLine")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
