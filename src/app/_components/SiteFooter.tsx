"use client";

import { usePathname } from "next/navigation";
import { TranslateAwareLink } from "@/components/TranslateAwareLink";
import { NewsletterCapture } from "@/components/NewsletterCapture";
import { DonationBox } from "@/components/DonationBox";
import { FeedbackFooterTrigger } from "@/components/feedback/FeedbackFooterTrigger";
import { useTranslations } from "next-intl";

export function SiteFooter() {
  const pathname = usePathname() || "";
  const isAuthSurface = pathname === "/login" || pathname.startsWith("/zh/login");
  const t = useTranslations("footer");
  const tLearn = useTranslations("learnAi");
  const tAnswers = useTranslations("answers");
  return (
    <footer className="border-t border-slate-200 bg-page mt-8">
      <div className="container py-8">
        {!isAuthSurface ? (
          <div className="mb-8 flex flex-col lg:flex-row gap-8 lg:items-start lg:justify-between">
            <div className="max-w-md">
              <NewsletterCapture />
            </div>
            <DonationBox />
          </div>
        ) : null}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {t("launch")}
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <TranslateAwareLink href="/launch" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("productHuntLaunch")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/creator-invite" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("creatorInvite")}
                </TranslateAwareLink>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {t("tools")}
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <TranslateAwareLink href="/tools/tiktok-caption-generator" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("tiktokCaptionGenerator")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/tools/hashtag-generator" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("hashtagGenerator")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/tools/hook-generator" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("hookGenerator")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/tools/title-generator" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("titleGenerator")}
                </TranslateAwareLink>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {t("aiPrompts")}
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <TranslateAwareLink href="/ai-prompts" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("promptLibrary")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/ai-prompt-improver" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("promptImprover")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/learn-ai" className="hover:underline hover:text-sky-600 transition duration-150">
                  {tLearn("title")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/answers" className="hover:underline hover:text-sky-600 transition duration-150">
                  {tAnswers("title")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/prompt-playground" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("promptPlayground")}
                </TranslateAwareLink>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {t("platformTools")}
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <TranslateAwareLink href="/tiktok-tools" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("tiktokTools")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/youtube-tools" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("youtubeTools")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/instagram-tools" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("instagramTools")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/ai-tools-directory" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("aiToolsDirectory")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/examples" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("creatorExamples")}
                </TranslateAwareLink>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {t("resources")}
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <TranslateAwareLink href="/trending" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("trendingContent")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/questions" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("creatorQuestions")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/tiktok-captions" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("tiktokCaptions")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/youtube-titles" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("youtubeTitles")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/instagram-captions" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("instagramCaptions")}
                </TranslateAwareLink>
              </li>
              <li>
                <TranslateAwareLink href="/blog" className="hover:underline hover:text-sky-600 transition duration-150">
                  {t("blog")}
                </TranslateAwareLink>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ToolEagle. {t("builtForCreators")}{" "}
            <TranslateAwareLink href="/privacy" className="hover:underline hover:text-sky-600">
              {t("privacy")}
            </TranslateAwareLink>
            {" · "}
            <TranslateAwareLink href="/terms" className="hover:underline hover:text-sky-600">
              {t("terms")}
            </TranslateAwareLink>
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <a
              href="https://www.tiktok.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline hover:text-sky-600 transition duration-150"
            >
              TikTok
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline hover:text-sky-600 transition duration-150"
            >
              Instagram
            </a>
            <a
              href="https://x.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline hover:text-sky-600 transition duration-150"
            >
              X
            </a>
          </div>
        </div>
      </div>
      <div className="container pb-6 text-xs text-slate-500 border-t border-slate-100 pt-4">
        <FeedbackFooterTrigger localeUi="en" />
      </div>
    </footer>
  );
}
