import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { CollectionClient } from "./CollectionClient";
import { Folder } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-white text-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-1 container pt-10">
          <p className="text-slate-600">Please log in to view your collection.</p>
          <Link href={`/login?next=/collections/${slug}`} className="mt-4 inline-block text-sky-600 hover:underline">
            Log in
          </Link>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, slug, created_at")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .single();

  if (!collection) notFound();

  const { data: items } = await supabase
    .from("collection_items")
    .select("save_id")
    .eq("collection_id", collection.id)
    .order("created_at", { ascending: false });

  const saveIds = (items ?? []).map((i) => i.save_id).filter(Boolean);
  const saves =
    saveIds.length > 0
      ? (
          await supabase
            .from("user_saves")
            .select("id, item_type, example_slug, tool_slug, tool_name, content, created_at")
            .in("id", saveIds)
            .eq("user_id", user.id)
        ).data ?? []
      : [];

  const ordered = saveIds
    .map((id) => saves.find((s) => s.id === id))
    .filter(Boolean) as typeof saves;

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <Link href="/me/saved" className="text-sm font-medium text-sky-600 hover:underline">
            ← My Saved
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <Folder className="h-6 w-6 text-sky-500" />
            <h1 className="text-2xl font-semibold text-slate-900">{collection.name}</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {ordered.length} item{ordered.length !== 1 ? "s" : ""}
          </p>

          <CollectionClient
            collectionSlug={slug}
            initialItems={ordered}
          />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
