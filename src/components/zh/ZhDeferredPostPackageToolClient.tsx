"use client";

import dynamic from "next/dynamic";
import type { PostPackageToolClientProps } from "@/components/tools/PostPackageToolClient";

const PostPackageToolClient = dynamic(
  () => import("@/components/tools/PostPackageToolClient").then((m) => m.PostPackageToolClient),
  {
    ssr: false,
    loading: () => (
      <div
        className="container pt-10 pb-16 min-h-[420px] rounded-2xl bg-slate-50/90 border border-slate-100 animate-pulse"
        aria-busy
        aria-label="加载工具"
      />
    )
  }
);

/**
 * V99 — Defer heavy tool client bundle on CN routes so hero/header paint first.
 * Same props as PostPackageToolClient.
 */
export function ZhDeferredPostPackageToolClient(props: PostPackageToolClientProps) {
  return <PostPackageToolClient {...props} />;
}
