import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 供编辑页客户端拉取单篇；在 Route Handler 里跑，与 Hub 相同双路径（anon/service + 登录会话）。
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id: raw } = await params;
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  /** `*`：未跑 cover/排期等迁移时，显式列名会失败；`*` 只返回存在的列。 */
  const db = createAdminClient();
  const first = await db.from("seo_articles").select("*").eq("id", id).maybeSingle();

  let row = first.data;
  let detail = first.error?.message ?? null;

  if (!row) {
    const session = await createClient();
    const second = await session.from("seo_articles").select("*").eq("id", id).maybeSingle();
    if (second.data) {
      row = second.data;
      detail = null;
    } else {
      detail = second.error?.message ?? detail ?? "no_row";
    }
  }

  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found", detail }, { status: 404 });
  }

  return NextResponse.json({ ok: true, article: row });
}
