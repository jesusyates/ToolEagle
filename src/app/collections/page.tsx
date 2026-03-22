import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { Folder } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Collections | ToolEagle",
  description: "Your saved collections of captions, hooks, and examples."
};

export default async function CollectionsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect(buildLoginRedirect("/collections"));

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <Link href="/me" className="text-sm font-medium text-sky-600 hover:underline">
            ← Me
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <Folder className="h-6 w-6 text-sky-500" />
            <h1 className="text-2xl font-semibold text-slate-900">My Collections</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Organize your saved content into collections.
          </p>

          {(collections?.length ?? 0) === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
              <Folder className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No collections yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Create collections from your saved items.
              </p>
              <Link
                href="/me/saved"
                className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Go to My Saved
              </Link>
            </div>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections!.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/collections/${c.slug}`}
                    className="block rounded-xl border border-slate-200 p-6 hover:border-sky-300 hover:shadow-md transition"
                  >
                    <h2 className="font-semibold text-slate-900">{c.name}</h2>
                    <span className="mt-1 text-sm text-slate-500">View collection →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <Link href="/me/saved" className="text-sm font-medium text-sky-600 hover:underline">
              My Saved →
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
