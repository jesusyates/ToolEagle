import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl font-semibold text-slate-900">Sign-in failed</h1>
          <p className="mt-2 text-slate-600">
            Something went wrong. Please try again.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to login
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
