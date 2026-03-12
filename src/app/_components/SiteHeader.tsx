import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" }
];

export function SiteHeader() {
  return (
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

        <nav className="hidden sm:flex items-center gap-3 text-xs text-slate-300">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/70 hover:border-sky-500/70 hover:text-sky-200 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

