import Link from "next/link";

export const metadata = {
  title: "Tools",
  description:
    "Browse ToolEagle tools for creators, starting with the TikTok Caption Generator and more tools coming soon."
};

const tools = [
  {
    slug: "tiktok-caption-generator",
    name: "TikTok Caption Generator",
    status: "Live",
    description:
      "Turn a simple idea into a ready-to-post TikTok caption with hooks, emojis and hashtags."
  },
  {
    slug: "hook-intro-generator",
    name: "Hook & Intro Generator",
    status: "Coming soon",
    description: "Craft hooks for TikTok, Reels, Shorts and carousels in seconds."
  },
  {
    slug: "content-idea-bank",
    name: "Content Idea Bank",
    status: "Coming soon",
    description: "Store, organize and recycle content ideas so you never run out on posting days."
  }
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 flex items-center justify-center text-xs font-semibold shadow-lg shadow-cyan-500/40">
              TE
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ToolEagle</p>
              <p className="text-xs text-slate-400">Free Tools for Creators</p>
            </div>
          </Link>
        </div>
      </header>

      <div className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-10 pb-16">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              Tools
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Free tools for every creator
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              ToolEagle is building a small, focused set of utilities to help you move from idea to
              published content faster.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => {
              const isLive = tool.status === "Live";
              const card = (
                <article
                  key={tool.slug}
                  className={`rounded-2xl border p-4 ${
                    isLive
                      ? "border-sky-500/40 bg-sky-500/10 hover:border-sky-400/80"
                      : "border-slate-800 bg-slate-900/60 opacity-80"
                  } transition`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isLive ? "text-sky-200" : "text-slate-400"
                    }`}
                  >
                    {tool.status}
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-50">{tool.name}</h2>
                  <p className="mt-1.5 text-xs text-slate-200">{tool.description}</p>
                </article>
              );

              return isLive ? (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/80 rounded-2xl"
                >
                  {card}
                </Link>
              ) : (
                <div key={tool.slug}>{card}</div>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-900/80 bg-slate-950/90">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} ToolEagle. Built for creators.
          </p>
          <p className="text-[11px] text-slate-500">
            Have an idea for a tool? Add it to your backlog and prototype it here.
          </p>
        </div>
      </footer>
    </main>
  );
}

