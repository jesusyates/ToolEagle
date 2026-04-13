import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BatchAction = "soft_delete" | "restore" | "publish";

export async function POST(request: Request) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    ids?: unknown;
  } | null;

  const action = typeof body?.action === "string" ? body.action.trim() : "";
  const ids = Array.isArray(body?.ids)
    ? body!.ids.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];

  if (!action || ids.length === 0) {
    return NextResponse.json({ ok: false, error: "action_and_ids_required" }, { status: 400 });
  }

  const allowed: BatchAction[] = ["soft_delete", "restore", "publish"];
  if (!allowed.includes(action as BatchAction)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
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
    const r = row as { id: string; status: string; deleted: boolean | null };

    if (action === "soft_delete") {
      if (r.deleted === true) {
        skipped.push(`${id}:already_deleted`);
        continue;
      }
      const { error } = await db.from("seo_articles").update({ deleted: true, updated_at: now }).eq("id", id);
      if (!error) applied++;
      else skipped.push(`${id}:update_error`);
      continue;
    }

    if (action === "restore") {
      if (r.deleted !== true) {
        skipped.push(`${id}:not_in_trash`);
        continue;
      }
      const { error } = await db.from("seo_articles").update({ deleted: false, updated_at: now }).eq("id", id);
      if (!error) applied++;
      else skipped.push(`${id}:update_error`);
      continue;
    }

    if (action === "publish") {
      if (r.deleted === true) {
        skipped.push(`${id}:soft_deleted`);
        continue;
      }
      if (r.status !== "draft") {
        skipped.push(`${id}:not_draft`);
        continue;
      }
      const { error } = await db.from("seo_articles").update({ status: "published", updated_at: now }).eq("id", id);
      if (!error) applied++;
      else skipped.push(`${id}:update_error`);
    }
  }

  return NextResponse.json({ ok: true, applied, skipped });
}
