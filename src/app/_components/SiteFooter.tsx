export function SiteFooter() {
  return (
    <footer className="border-t border-slate-900/80 bg-slate-950/90 mt-8">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[11px] text-slate-500">
          © {new Date().getFullYear()} ToolEagle. Built for creators.
        </p>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <a
            href="https://www.tiktok.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-sky-300"
          >
            TikTok
          </a>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-pink-300"
          >
            Instagram
          </a>
          <a
            href="https://x.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-sky-300"
          >
            X
          </a>
        </div>
      </div>
    </footer>
  );
}

