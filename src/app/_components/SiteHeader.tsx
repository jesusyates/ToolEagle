import Link from "next/link";
import { Bird } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" }
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Bird className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900">
              ToolEagle
            </p>
            <p className="text-xs text-slate-600">Free Tools for Creators</p>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-2 text-sm text-slate-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-full hover:bg-slate-100 hover:underline transition duration-150"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

