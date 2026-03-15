"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isSupabase = error.message?.includes("Supabase");
  const isProjects = error.message?.includes("projects") || error.message?.includes("relation");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="max-w-md w-full text-center">
        <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          {isSupabase ? (
            <>
              Supabase is not configured. Create a file named <strong>.env.local</strong> in the
              project root and add:
              <ul className="mt-2 list-inside list-disc space-y-1 mx-auto w-fit text-left">
                <li>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{" "}
                  = your Supabase project URL
                </li>
                <li>
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>{" "}
                  = your Supabase anon key
                </li>
              </ul>
              <span className="block mt-2">
                Get these from Supabase Dashboard → Project Settings → API. Then restart{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">npm run dev</code>.
              </span>
            </>
          ) : isProjects ? (
            <>
              The projects table may not exist yet. Run the Phase 19 migration in Supabase SQL
              Editor.
            </>
          ) : (
            error.message || "An unexpected error occurred."
          )}
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
