import Link from "next/link";

export function CreatorModeDemo() {
  return (
    <section className="bg-slate-50 border-y border-slate-200">
      <div className="container py-12">
        <h2 className="text-lg font-semibold text-slate-900">Creator Mode Demo</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Enter topic, pick platform and tone—get hook, caption, hashtags and video idea in one go.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Input</p>
              <div className="mt-3 space-y-2">
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-500">Topic:</span> Travel vlog
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-500">Platform:</span> TikTok
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-500">Tone:</span> Funny
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Output</p>
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-sky-100 bg-sky-50/50 px-3 py-2 text-sm">
                  <span className="font-medium text-sky-800">Hook:</span> You won&apos;t believe what happened in this trip...
                </div>
                <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">Caption:</span> This travel vlog turned chaotic 😂
                </div>
                <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">Hashtags:</span> #travel #funny #vlog
                </div>
                <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">Video idea:</span> Things that go wrong during travel
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/creator"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition"
          >
            Try Creator Mode →
          </Link>
        </div>
      </div>
    </section>
  );
}
