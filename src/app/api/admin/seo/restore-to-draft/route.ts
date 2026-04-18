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

/**
 * Restore to editable draft: `deleted = false`, `status = draft`, clear schedule fields.
 * Works from recycle bin or from published (rewrite path).
 */
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
      .select("id, deleted, status")
      .eq("id", id)
      .maybeSingle();
    if (fe || !row) {
      skipped.push(`${id}:not_found`);
      continue;
    }
    const r = row as { deleted?: boolean; status?: string };
    const st = String(r.status ?? "").toLowerCase();
    if (r.deleted !== true && st === "draft") {
      skipped.push(`${id}:already_draft`);
      continue;
    }
    const { error } = await db
      .from("seo_articles")
      .update({
        deleted: false,
        status: "draft",
        publish_scheduled_at: null,
        publish_queue_source: null,
        updated_at: now
      })
      .eq("id", id);
    if (!error) applied++;
    else skipped.push(`${id}:update_error`);
  }

  revalidatePath("/admin/seo");
  return NextResponse.json({ ok: true, applied, skipped });
}
