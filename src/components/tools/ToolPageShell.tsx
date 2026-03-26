import { ReactNode } from "react";

type ToolPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  /** V109.5 — First-screen clarity (global EN): what problem + who it’s for */
  introProblem?: string;
  introAudience?: string;
  input: ReactNode;
  result: ReactNode;
  howItWorks?: ReactNode;
  proTips?: ReactNode;
  aside?: ReactNode;
  extraSections?: Array<{ title: string; content: ReactNode }>;
  toolSlug?: string;
  toolName?: string;
  /** V97.1 — China-local mid CTA → /zh/pricing */
  siteMode?: "global" | "china";
  /** next-intl locale — controls Steps vs 操作步骤 and fold titles on global pages */
  locale?: string;
};

function FoldSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
        {title}
      </summary>
      <div className="border-t border-slate-100 px-4 py-4">{children}</div>
    </details>
  );
}

export function ToolPageShell({
  eyebrow,
  title,
  description,
  introProblem,
  introAudience,
  input,
  result,
  howItWorks,
  proTips,
  aside,
  extraSections,
  toolSlug,
  toolName,
  siteMode = "global",
  locale
}: ToolPageShellProps) {
  const headerOnDark = siteMode === "china" && typeof toolSlug === "string" && toolSlug.startsWith("douyin-");
  const zhUi = Boolean(locale?.startsWith("zh"));

  return (
    <section className="container pt-10 pb-16">
      <div className="space-y-2 max-w-2xl">
        {eyebrow && (
          <p
            className={
              headerOnDark
                ? "text-xs font-semibold tracking-wide text-red-300/95"
                : "text-xs font-semibold uppercase tracking-[0.2em] text-sky-700"
            }
          >
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          <span
            className={
              headerOnDark
                ? "inline-block rounded-xl bg-slate-900/70 px-2.5 py-1 text-white shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                : "inline-block rounded-xl bg-sky-100 px-2.5 py-1 text-sky-950 shadow-[0_2px_8px_rgba(2,132,199,0.18)]"
            }
          >
            {title}
          </span>
        </h1>
        <p
          className={
            headerOnDark
              ? "inline-block rounded-xl bg-slate-900/65 px-3 py-2 text-sm sm:text-base text-slate-100 leading-relaxed"
              : "inline-block rounded-xl bg-sky-50 px-3 py-2 text-sm sm:text-base text-slate-800 leading-relaxed shadow-[0_2px_8px_rgba(2,132,199,0.12)]"
          }
        >
          {description}
        </p>
        {!headerOnDark && (siteMode !== "china" || introProblem) ? (
          <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-800">
            {siteMode === "china" ? (
              <p>
                <span className="font-semibold text-slate-900">操作步骤：</span>
                {introProblem}
              </p>
            ) : introAudience === "" && introProblem ? (
              <p>
                <span className="font-semibold text-slate-900">{zhUi ? "操作步骤：" : "Steps: "}</span>
                {introProblem}
              </p>
            ) : (
              <>
                <p>
                  <span className="font-semibold text-slate-900">What this tool does: </span>
                  {introProblem || "you want fast, usable output from one clear input."}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Best for: </span>
                  {introAudience || "creators who want to go from idea to publish-ready draft quickly."}
                </p>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)] items-start">
        <div className="space-y-4">
          {input}
          {result}
        </div>

        <div className="space-y-3 lg:sticky lg:top-6">
          {howItWorks ? (
            <FoldSection
              title={
                siteMode === "china" || zhUi ? "怎么用（含示例）" : "How to use + examples"
              }
            >
              {howItWorks}
            </FoldSection>
          ) : null}
          {proTips ? (
            <FoldSection title={siteMode === "china" || zhUi ? "进阶技巧" : "Tips"}>{proTips}</FoldSection>
          ) : null}
          {extraSections && extraSections.length > 0
            ? extraSections.map((sec) => (
                <FoldSection key={sec.title} title={sec.title}>
                  {sec.content}
                </FoldSection>
              ))
            : aside
              ? <FoldSection title="More">{aside}</FoldSection>
              : null}
        </div>
      </div>
    </section>
  );
}

