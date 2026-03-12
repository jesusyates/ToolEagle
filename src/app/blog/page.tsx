export const metadata = {
  title: "Creator Resources & Tips",
  description:
    "Articles, tips and case studies on how to use ToolEagle tools to publish better content, faster."
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 flex items-center justify-center text-xs font-semibold shadow-lg shadow-cyan-500/40">
              TE
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ToolEagle</p>
              <p className="text-xs text-slate-400">Free Tools for Creators</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-10 pb-16">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              Resources
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Creator playbook & case studies
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              This space will collect short, practical articles on how real creators use tools like
              the TikTok Caption Generator, Hashtag Generator and more to ship content consistently.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
            <p className="text-xs font-semibold text-slate-200">Coming soon</p>
            <p className="mt-2 text-xs text-slate-400">
              As ToolEagle grows, this page will feature:
            </p>
            <ul className="mt-2 list-disc list-inside text-xs text-slate-400 space-y-1">
              <li>Quick-start guides for each tool.</li>
              <li>Swipeable caption, hook and hashtag templates.</li>
              <li>Real-world examples from creators across niches.</li>
            </ul>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-900/80 bg-slate-950/90">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} ToolEagle. Built for creators.
          </p>
          <p className="text-[11px] text-slate-500">
            New articles and examples will be added over time.
          </p>
        </div>
      </footer>
    </main>
  );
}

