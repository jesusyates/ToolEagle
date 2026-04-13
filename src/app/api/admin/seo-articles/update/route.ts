import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeSlug(raw: string): string {
  return (
    raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "guide"
  );
}

export async function POST(request: Request) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    title?: unknown;
    slug?: unknown;
    description?: unknown;
    content?: unknown;
  } | null;

  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const slugRaw = typeof body?.slug === "string" ? body.slug : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const content = typeof body?.content === "string" ? body.content : "";

  if (!id || !title || !slugRaw) {
    return NextResponse.json({ ok: false, error: "id_title_slug_required" }, { status: 400 });
  }

  const slug = normalizeSlug(slugRaw);
  const db = createAdminClient();

  const { data: other } = await db.from("seo_articles").select("id").eq("slug", slug).maybeSingle();
  if (other && (other as { id: string }).id !== id) {
    return NextResponse.json({ ok: false, error: "slug_taken" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error } = await db
    .from("seo_articles")
    .update({
      title,
      slug,
      description: description.length > 0 ? description : null,
      content,
      updated_at: now
    })
    .eq("id", id);

  if (error) {
    console.error("[seo-articles/update]", error);
    return NextResponse.json({ ok: false, error: "update_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug });
}
