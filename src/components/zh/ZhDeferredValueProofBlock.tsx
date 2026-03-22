"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ValueProofBlock = dynamic(
  () => import("@/components/value/ValueProofBlock").then((m) => m.ValueProofBlock),
  {
    ssr: false,
    loading: () => (
      <div className="mt-10 min-h-[140px] rounded-xl bg-slate-50 animate-pulse border border-slate-100" aria-hidden />
    )
  }
);

/** V99 — Below-the-fold value block without blocking growth-kit hero */
export function ZhDeferredValueProofBlock(props: ComponentProps<typeof ValueProofBlock>) {
  return <ValueProofBlock {...props} />;
}
