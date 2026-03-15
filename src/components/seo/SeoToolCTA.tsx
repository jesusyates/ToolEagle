import Link from "next/link";
import { tools } from "@/config/tools";
import type { ReactNode } from "react";

export type SeoToolCTAProps = {
  toolName: string;
  toolSlug: string;
  description: string;
  icon: ReactNode;
  buttonLabel?: string;
};

/** Legacy props for backward compatibility */
type LegacyProps = {
  toolSlug: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
};

function isLegacyProps(
  props: SeoToolCTAProps | LegacyProps
): props is LegacyProps {
  return "toolSlug" in props && !("toolName" in props) && !("icon" in props);
}

export function SeoToolCTA(
  props: SeoToolCTAProps | LegacyProps
) {
  if (isLegacyProps(props)) {
    const tool = tools.find((t) => t.slug === props.toolSlug);
    const Icon = tool?.icon ?? null;
    return (
      <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-sky-200">
              <Icon className="h-6 w-6 text-sky-700" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900">
              {props.title ?? tool?.name ?? "AI Generator"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {props.description ?? tool?.description ?? "Generate content instantly with AI. No sign-up required."}
            </p>
            <Link
              href={`/tools/${props.toolSlug}`}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition duration-150"
            >
              {props.buttonLabel ?? "Generate with AI"} →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { toolName, toolSlug, description, icon, buttonLabel = "Generate with AI" } = props;

  return (
    <section className="mt-12 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-sky-200">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{toolName}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
          <Link
            href={`/tools/${toolSlug}`}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition duration-150"
          >
            {buttonLabel} →
          </Link>
        </div>
      </div>
    </section>
  );
}
