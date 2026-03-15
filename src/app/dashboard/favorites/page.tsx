import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { FavoritesClient } from "./FavoritesClient";
import { Star } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Favorites | ToolEagle",
  description: "Your saved results from ToolEagle tools."
};

export default async function DashboardFavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/favorites");
  }

  const { data: rows } = await supabase
    .from("favorites")
    .select("id, tool_slug, tool_name, text, saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })
    .limit(100);

  const favorites = (rows ?? []).map((r) => ({
    id: r.id,
    toolSlug: r.tool_slug,
    toolName: r.tool_name,
    text: r.text,
    savedAt: new Date(r.saved_at).getTime()
  }));

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-sky-600 hover:text-sky-800"
              >
                ← Dashboard
              </Link>
              <div className="flex items-center gap-2 mt-2">
                <Star className="h-6 w-6 text-amber-500" />
                <h1 className="text-2xl font-semibold text-slate-900">
                  My Favorites
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Your saved results from AI tools.
              </p>
            </div>
          </div>

          <FavoritesClient
            initialFavorites={favorites}
          />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
