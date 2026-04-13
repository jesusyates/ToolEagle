import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvEscape(s: string): string {
  const t = s.replace(/\r\n/g, "\n");
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export async function POST(request: Request) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? body!.ids.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "ids_required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: rows, error } = await db
    .from("seo_articles")
    .select("id,title,slug,description,content,status,deleted,created_at,updated_at")
    .in("id", ids);

  if (error) {
    console.error("[seo-articles/export]", error);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }

  const header = ["id", "title", "slug", "description", "content", "status", "deleted", "created_at", "updated_at"];
  const lines = [header.join(",")];
  for (const r of rows ?? []) {
    const row = r as Record<string, string | boolean | null>;
    lines.push(
      [
        csvEscape(String(row.id ?? "")),
        csvEscape(String(row.title ?? "")),
        csvEscape(String(row.slug ?? "")),
        csvEscape(String(row.description ?? "")),
        csvEscape(String(row.content ?? "")),
        csvEscape(String(row.status ?? "")),
        csvEscape(String(row.deleted === true)),
        csvEscape(String(row.created_at ?? "")),
        csvEscape(String(row.updated_at ?? ""))
      ].join(",")
    );
  }

  const csv = lines.join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="seo-articles-export.csv"`
    }
  });
}
