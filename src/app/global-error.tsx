"use client";

import { DelegatedButton } from "@/components/DelegatedButton";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-white text-slate-900">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <DelegatedButton
            onClick={reset}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try again
          </DelegatedButton>
        </div>
      </body>
    </html>
  );
}
