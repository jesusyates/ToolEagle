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

async function allocateUniqueSlug(admin: ReturnType<typeof createAdminClient>, base: string): Promise<string> {
  const normalized = normalizeSlug(base);
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? normalized : `${normalized}-${n}`;
    const { data } = await admin.from("seo_articles").select("slug").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    n++;
  }
}

export async function POST(request: Request) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    slug?: unknown;
    description?: unknown;
    content?: unknown;
    status?: unknown;
  } | null;

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const slugInput = typeof body?.slug === "string" ? body.slug.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const content = typeof body?.content === "string" ? body.content : "";
  const statusRaw = typeof body?.status === "string" ? body.status.trim().toLowerCase() : "draft";
  const status = statusRaw === "published" ? "published" : "draft";

  if (!title || !slugInput) {
    return NextResponse.json({ ok: false, error: "title_and_slug_required" }, { status: 400 });
  }

  const db = createAdminClient();
  const finalSlug = await allocateUniqueSlug(db, slugInput);
  const now = new Date().toISOString();

  const { data: inserted, error } = await db
    .from("seo_articles")
    .insert({
      title,
      slug: finalSlug,
      description: description.length > 0 ? description : null,
      content: content.length > 0 ? content : " ",
      status,
      deleted: false,
      created_at: now,
      updated_at: now
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[seo-articles/create]", error);
    return NextResponse.json({ ok: false, error: "insert_failed", detail: error.message }, { status: 500 });
  }

  const rowId = (inserted as { id?: string } | null)?.id;
  return NextResponse.json({ ok: true, id: rowId, slug: finalSlug });
}
