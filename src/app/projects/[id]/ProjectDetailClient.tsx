"use client";

import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";

type ProjectItem = {
  id: string;
  content: string;
  type: string;
  createdAt: number;
};

type ProjectDetailClientProps = {
  project: { id: string; name: string; createdAt: number };
  items: ProjectItem[];
};

export function ProjectDetailClient({ project, items }: ProjectDetailClientProps) {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <Link
            href="/dashboard"
            className="text-sm text-sky-600 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>

          {items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center">
              <p className="text-slate-600">No items yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Save content from tools to add items to this project.
              </p>
              <Link
                href="/tools"
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Browse tools
              </Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  data-result-item
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <p className="text-sm text-slate-800 whitespace-pre-line" data-copy-source>
                    {item.content}
                  </p>
                  <div className="mt-3">
                    <ToolCopyButton
                      onClick={async () => { await safeCopyToClipboard(item.content); }}
                      variant="primary"
                      getTextToCopy={(btn) => {
                        const el = btn.closest("[data-result-item]")?.querySelector("[data-copy-source]");
                        return (el as HTMLElement)?.innerText?.trim() ?? null;
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
