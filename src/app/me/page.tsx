import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { Bookmark, UserPlus } from "lucide-react";

export const metadata = {
  title: "My Account | ToolEagle",
  description: "Your saved content and following."
};

export default function MePage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <h1 className="text-2xl font-semibold text-slate-900">My Account</h1>
          <p className="mt-2 text-slate-600">Manage your saved content and creators you follow.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/me/saved"
              className="flex items-center gap-4 rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
            >
              <Bookmark className="h-8 w-8 text-sky-500" />
              <div>
                <h2 className="font-semibold text-slate-900">My Saved</h2>
                <p className="text-sm text-slate-600">Captions, hooks, and examples</p>
              </div>
              <span className="ml-auto text-sky-600">→</span>
            </Link>
            <Link
              href="/me/following"
              className="flex items-center gap-4 rounded-xl border border-slate-200 p-5 hover:border-sky-300 hover:shadow-md transition"
            >
              <UserPlus className="h-8 w-8 text-sky-500" />
              <div>
                <h2 className="font-semibold text-slate-900">Following</h2>
                <p className="text-sm text-slate-600">Creators you follow</p>
              </div>
              <span className="ml-auto text-sky-600">→</span>
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
