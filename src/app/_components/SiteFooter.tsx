import Link from "next/link";
import { NewsletterCapture } from "@/components/NewsletterCapture";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-8">
      <div className="container py-8">
        <div className="mb-8 max-w-md">
          <NewsletterCapture />
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Launch
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/launch" className="hover:underline hover:text-sky-600 transition duration-150">
                  Product Hunt Launch
                </Link>
              </li>
              <li>
                <Link href="/creator-invite" className="hover:underline hover:text-sky-600 transition duration-150">
                  Creator Invite
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Tools
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/tools/tiktok-caption-generator" className="hover:underline hover:text-sky-600 transition duration-150">
                  TikTok Caption Generator
                </Link>
              </li>
              <li>
                <Link href="/tools/hashtag-generator" className="hover:underline hover:text-sky-600 transition duration-150">
                  Hashtag Generator
                </Link>
              </li>
              <li>
                <Link href="/tools/hook-generator" className="hover:underline hover:text-sky-600 transition duration-150">
                  Hook Generator
                </Link>
              </li>
              <li>
                <Link href="/tools/title-generator" className="hover:underline hover:text-sky-600 transition duration-150">
                  Title Generator
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              AI & Prompts
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/ai-prompts" className="hover:underline hover:text-sky-600 transition duration-150">
                  Prompt Library
                </Link>
              </li>
              <li>
                <Link href="/ai-prompt-improver" className="hover:underline hover:text-sky-600 transition duration-150">
                  Prompt Improver
                </Link>
              </li>
              <li>
                <Link href="/learn-ai" className="hover:underline hover:text-sky-600 transition duration-150">
                  Learn to Talk to AI
                </Link>
              </li>
              <li>
                <Link href="/answers" className="hover:underline hover:text-sky-600 transition duration-150">
                  Creator Answers
                </Link>
              </li>
              <li>
                <Link href="/prompt-playground" className="hover:underline hover:text-sky-600 transition duration-150">
                  Prompt Playground
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Platform Tools
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/tiktok-tools" className="hover:underline hover:text-sky-600 transition duration-150">
                  TikTok Tools
                </Link>
              </li>
              <li>
                <Link href="/youtube-tools" className="hover:underline hover:text-sky-600 transition duration-150">
                  YouTube Tools
                </Link>
              </li>
              <li>
                <Link href="/instagram-tools" className="hover:underline hover:text-sky-600 transition duration-150">
                  Instagram Tools
                </Link>
              </li>
              <li>
                <Link href="/ai-tools-directory" className="hover:underline hover:text-sky-600 transition duration-150">
                  AI Tools Directory
                </Link>
              </li>
              <li>
                <Link href="/examples" className="hover:underline hover:text-sky-600 transition duration-150">
                  Creator Examples
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Resources
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/trending" className="hover:underline hover:text-sky-600 transition duration-150">
                  Trending Content
                </Link>
              </li>
              <li>
                <Link href="/questions" className="hover:underline hover:text-sky-600 transition duration-150">
                  Creator Questions
                </Link>
              </li>
              <li>
                <Link href="/tiktok-captions" className="hover:underline hover:text-sky-600 transition duration-150">
                  TikTok Captions
                </Link>
              </li>
              <li>
                <Link href="/youtube-titles" className="hover:underline hover:text-sky-600 transition duration-150">
                  YouTube Titles
                </Link>
              </li>
              <li>
                <Link href="/instagram-captions" className="hover:underline hover:text-sky-600 transition duration-150">
                  Instagram Captions
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:underline hover:text-sky-600 transition duration-150">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ToolEagle. Built for creators.
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
    </footer>
  );
}
