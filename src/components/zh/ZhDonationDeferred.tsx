"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const DonationBox = dynamic(() => import("@/components/DonationBox").then((m) => m.DonationBox), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[200px] rounded-xl bg-slate-50 animate-pulse border border-slate-100"
      aria-hidden
    />
  )
});

/** V99 — QR / images load after first paint; copy stays visible in parent card */
export function ZhDonationDeferred(props: ComponentProps<typeof DonationBox>) {
  return <DonationBox {...props} />;
}
