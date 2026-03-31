import Link from "next/link";

/** App Router 404；避免 dev 下仅依赖 Pages `/404` 的兜底缺口。 */
export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-600">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Back to home
      </Link>
    </div>
  );
}
