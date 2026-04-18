import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseIds(body: unknown): string[] {
  const o = body as { articleIds?: unknown; ids?: unknown } | null;
  const raw = o?.articleIds ?? o?.ids;
  return Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
}

/** Soft-delete: `deleted = true` (articles stay in DB for recycle bin). */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const ids = parseIds(body);
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "articleIds_required" }, { status: 400 });
  }

  const db = createAdminClient();
  const now = new Date().toISOString();
  let applied = 0;
  const skipped: string[] = [];

  for (const id of ids) {
    const { data: row, error: fe } = await db
      .from("seo_articles")
      .select("id, deleted")
      .eq("id", id)
      .maybeSingle();
    if (fe || !row) {
      skipped.push(`${id}:not_found`);
      continue;
    }
    if ((row as { deleted?: boolean }).deleted === true) {
      skipped.push(`${id}:already_trash`);
      continue;
    }
    const { error } = await db.from("seo_articles").update({ deleted: true, updated_at: now }).eq("id", id);
    if (!error) applied++;
    else skipped.push(`${id}:update_error`);
  }

  revalidatePath("/admin/seo");
  return NextResponse.json({ ok: true, applied, skipped });
}
