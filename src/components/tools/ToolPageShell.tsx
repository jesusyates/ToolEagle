import { ReactNode } from "react";
import { CommunityProofBadge } from "./CommunityProofBadge";

type ToolPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  input: ReactNode;
  result: ReactNode;
  howItWorks?: ReactNode;
  proTips?: ReactNode;
  aside?: ReactNode;
  toolSlug?: string;
  toolName?: string;
};

export function ToolPageShell({
  eyebrow,
  title,
  description,
  input,
  result,
  howItWorks,
  proTips,
  aside,
  toolSlug,
  toolName
}: ToolPageShellProps) {
  return (
    <section className="container pt-10 pb-16">
      <div className="space-y-2 max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {description}
        </p>
        <div className="pt-2">
          <CommunityProofBadge />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
        <div className="space-y-4">
          {input}
          {result}
          {howItWorks}
          {proTips}
        </div>
        {aside && <aside className="space-y-4">{aside}</aside>}
      </div>
    </section>
  );
}

