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

/** Cancel scheduled publish: back to draft, clear schedule metadata. */
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
      .select("id, status, deleted")
      .eq("id", id)
      .maybeSingle();
    if (fe || !row) {
      skipped.push(`${id}:not_found`);
      continue;
    }
    const r = row as { status?: string; deleted?: boolean };
    if (r.deleted === true) {
      skipped.push(`${id}:in_trash`);
      continue;
    }
    if (String(r.status ?? "").toLowerCase() !== "scheduled") {
      skipped.push(`${id}:not_scheduled`);
      continue;
    }
    const { error } = await db
      .from("seo_articles")
      .update({
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
