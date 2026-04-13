import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let id: string | undefined;
  try {
    const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
    id = typeof body?.id === "string" ? body.id.trim() : undefined;
  } catch {
    id = undefined;
  }
  if (!id) {
    return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
  }

  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data: existing, error: fetchErr } = await db.from("seo_articles").select("id").eq("id", id).maybeSingle();
  if (fetchErr || !existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const { error } = await db.from("seo_articles").update({ deleted: false, updated_at: now }).eq("id", id);

  if (error) {
    console.error("[seo-drafts/restore]", error);
    return NextResponse.json({ ok: false, error: "update_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
