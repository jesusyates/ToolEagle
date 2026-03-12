export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-8">
      <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} ToolEagle. Built for creators.
        </p>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <a
            href="https://www.tiktok.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-900"
          >
            TikTok
          </a>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-900"
          >
            Instagram
          </a>
          <a
            href="https://x.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-900"
          >
            X
          </a>
        </div>
      </div>
    </footer>
  );
}

