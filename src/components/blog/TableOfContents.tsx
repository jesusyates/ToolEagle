import Link from "next/link";

type TocItem = { title: string; id: string };

type TableOfContentsProps = {
  items: TocItem[];
};

export function TableOfContents({ items }: TableOfContentsProps) {
  if (!items?.length) return null;

  return (
    <nav className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-8">
      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
        Table of contents
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-sm text-slate-700 hover:text-sky-700 hover:underline transition duration-150"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
