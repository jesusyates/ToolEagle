"use client";

import { useEffect } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";

/**
 * Root error boundary must NOT use next-intl hooks — if i18n fails, useTranslations throws
 * and Next dev shows "missing required error components, refreshing..." in a loop.
 */
export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
      <DelegatedButton
        onClick={reset}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Try again
      </DelegatedButton>
    </div>
  );
}
