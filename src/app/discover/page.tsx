import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { DiscoverClient } from "./DiscoverClient";
import { Compass } from "lucide-react";

const BASE_URL = "https://www.tooleagle.com";
const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Discover | ToolEagle",
  description: "Endless feed of captions, hooks, and examples from creators.",
  alternates: { canonical: `${BASE_URL}/discover` }
};

export const dynamic = "force-dynamic";

async function getDiscoverFeed(page: number = 0) {
  const supabase = await createClient();
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("public_examples")
    .select("slug, tool_name, tool_slug, result, creator_username, created_at")
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { items: [], hasMore: false };

  const items = (data ?? []).map((r) => ({
    slug: r.slug,
    toolName: r.tool_name,
    toolSlug: r.tool_slug,
    result: r.result,
    creatorUsername: r.creator_username,
    createdAt: r.created_at
  }));

  return {
    items,
    hasMore: items.length === PAGE_SIZE
  };
}

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function DiscoverPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNum = Math.max(0, parseInt(page ?? "0", 10) || 0);
  const { items, hasMore } = await getDiscoverFeed(pageNum);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="container py-12">
            <div className="flex items-center gap-2">
              <Compass className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Discover
              </h1>
            </div>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">
              Endless feed of captions, hooks, and examples from creators. Save your favorites.
            </p>
          </div>
        </section>

        <DiscoverClient
          initialItems={items}
          initialPage={pageNum}
          hasMore={hasMore}
        />
      </div>

      <SiteFooter />
    </main>
  );
}
