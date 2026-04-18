import { zipSync } from "fflate";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import {
  buildSingleArticleCsv,
  contentDispositionAttachment,
  sanitizeSlugForFilename
} from "@/lib/admin/seo-articles-csv";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CHUNK = 80;

async function fetchRowsByIds(db: ReturnType<typeof createAdminClient>, uniqueIds: string[]) {
  const rowById = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < uniqueIds.length; i += CHUNK) {
    const chunk = uniqueIds.slice(i, i + CHUNK);
    const { data: rows, error } = await db.from("seo_articles").select("*").in("id", chunk);
    if (error) {
      return { error: error.message, rowById: null as Map<string, Record<string, unknown>> | null };
    }
    for (const r of rows ?? []) {
      const row = r as { id?: unknown };
      const idKey = row.id != null ? String(row.id) : "";
      if (idKey) rowById.set(idKey, r as Record<string, unknown>);
    }
  }
  return { error: null as string | null, rowById };
}

function allocateCsvBasenames(rows: Record<string, unknown>[]): string[] {
  const used = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const id = String(r.id ?? "");
    const slug = String((r.slug as string | undefined) ?? "");
    const base = sanitizeSlugForFilename(slug, id);
    let candidate = base;
    let n = 1;
    while (used.has(candidate)) {
      n++;
      candidate = `${base}-${n}`;
    }
    used.add(candidate);
    out.push(candidate);
  }
  return out;
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
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0))];
  if (uniqueIds.length === 0) {
    return NextResponse.json({ ok: false, error: "ids_required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { error: fetchErr, rowById } = await fetchRowsByIds(db, uniqueIds);
  if (fetchErr || !rowById) {
    console.error("[seo-articles/export]", fetchErr);
    return NextResponse.json(
      { ok: false, error: "fetch_failed", detail: fetchErr ?? "unknown" },
      { status: 500 }
    );
  }

  const singleMode = uniqueIds.length === 1;
  const orderedRows = uniqueIds.map((id) => rowById.get(id)).filter((r): r is Record<string, unknown> => r != null);

  if (singleMode) {
    if (orderedRows.length === 0) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const row = orderedRows[0]!;
    const id = String(row.id ?? "");
    const slug = String((row.slug as string | undefined) ?? "");
    const base = sanitizeSlugForFilename(slug, id);
    const filename = `${base}.csv`;
    const csv = buildSingleArticleCsv(row);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": contentDispositionAttachment(filename),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Export-Requested": "1",
        "X-Export-Returned": "1"
      }
    });
  }

  if (orderedRows.length === 0) {
    return NextResponse.json({ ok: false, error: "none_found" }, { status: 404 });
  }

  const basenames = allocateCsvBasenames(orderedRows);
  const enc = new TextEncoder();
  const zipEntries: Record<string, Uint8Array> = {};
  for (let i = 0; i < orderedRows.length; i++) {
    const row = orderedRows[i]!;
    const name = `${basenames[i]!}.csv`;
    zipEntries[name] = enc.encode(buildSingleArticleCsv(row));
  }

  const zipped = zipSync(zipEntries, { level: 0 });
  const zipName = `seo-articles-${orderedRows.length}-export.zip`;

  return new NextResponse(zipped, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": contentDispositionAttachment(zipName),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Export-Requested": String(uniqueIds.length),
      "X-Export-Returned": String(orderedRows.length)
    }
  });
}
