import Link from "next/link";
import { tools } from "@/config/tools";

type ToolLinkProps = {
  slug: string;
  children?: React.ReactNode;
};

export function ToolLink({ slug, children }: ToolLinkProps) {
  const tool = tools.find((t) => t.slug === slug);
  if (!tool) {
    return <span>{children ?? slug}</span>;
  }

  return (
    <Link href={`/tools/${tool.slug}`} className="text-sky-700 underline font-medium">
      {children ?? tool.name}
    </Link>
  );
}

type BoxProps = {
  title?: string;
  children: React.ReactNode;
};

export function TipBox({ title = "Tip", children }: BoxProps) {
  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

export function NoteBox({ title = "Note", children }: BoxProps) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-1">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

export const mdxComponents = {
  ToolLink,
  TipBox,
  NoteBox,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} className="text-sky-700 underline" />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      {...props}
      className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] font-mono text-slate-800"
    />
  )
};

