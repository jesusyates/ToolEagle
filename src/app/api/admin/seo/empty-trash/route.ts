import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Permanently delete all soft-deleted rows. */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { confirm?: unknown };
  if (body.confirm !== true) {
    return NextResponse.json({ ok: false, error: "confirm_required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: rows, error: selErr } = await db.from("seo_articles").select("id").eq("deleted", true);
  if (selErr) {
    return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });
  }

  const ids = (rows ?? []).map((r) => (r as { id: string }).id).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const { error: delErr } = await db.from("seo_articles").delete().eq("deleted", true);
  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  revalidatePath("/admin/seo");
  return NextResponse.json({ ok: true, deleted: ids.length });
}
