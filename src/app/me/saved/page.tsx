import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { SavedClient } from "./SavedClient";
import { Bookmark } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Saved | ToolEagle",
  description: "Your saved captions, hooks, and examples."
};

export default async function MeSavedPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/me/saved");

  const { data: saves } = await supabase
    .from("user_saves")
    .select("id, item_type, example_slug, answer_slug, tool_slug, tool_name, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug")
    .eq("user_id", user.id);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <Link href="/me" className="text-sm font-medium text-sky-600 hover:underline">
            ← Me
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <Bookmark className="h-6 w-6 text-sky-500" />
            <h1 className="text-2xl font-semibold text-slate-900">My Saved</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Captions, hooks, and examples you&apos;ve saved.
          </p>

          <SavedClient
            initialSaves={saves ?? []}
            collections={collections ?? []}
          />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
