import type { ReactNode } from "react";
import { ToolEntrySourceTracker } from "@/components/tools/ToolEntrySourceTracker";

/** V108: Tool entry source tracking (client) — no visual change. */
export default function ToolsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ToolEntrySourceTracker />
      {children}
    </>
  );
}
