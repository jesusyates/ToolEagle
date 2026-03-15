import Link from "next/link";
import { NewsletterCapture } from "@/components/NewsletterCapture";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-8">
      <div className="container py-8">
        <div className="mb-8 max-w-md">
          <NewsletterCapture />
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
              Resources
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
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
