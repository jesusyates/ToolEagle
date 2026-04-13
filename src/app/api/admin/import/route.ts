import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveSeoArticleWithAutoFix } from "@/lib/seo/seo-gate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function redirectOrigin(request: Request): string {
  try {
    const u = new URL(request.url);
    return u.origin;
  } catch {
    return "";
  }
}

async function allocateUniqueSlug(admin: ReturnType<typeof createAdminClient>, base: string): Promise<string> {
  const normalized =
    base
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "guide";
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? normalized : `${normalized}-${n}`;
    const { data } = await admin.from("seo_articles").select("slug").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    n++;
  }
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json({ ok: true, route: "admin/import" });
}

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const fd = await request.formData();
  const returnToRaw = String(fd.get("return_to") ?? "").trim();
  const file = fd.get("file");
  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return NextResponse.json({ ok: false, error: "missing file" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const text = buf.toString("utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return NextResponse.json({ ok: false, error: "CSV must have header + at least one row" }, { status: 400 });
  }

  const header = parseCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const ti = header.indexOf("title");
  const si = header.indexOf("slug");
  const di = header.indexOf("description");
  const ci = header.indexOf("content");
  if (ti < 0 || si < 0 || ci < 0) {
    return NextResponse.json(
      { ok: false, error: "CSV header must include title, slug, content (and optionally description)" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  let inserted = 0;
  let failed = 0;
  let fixed = 0;

  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r]!);
    const title = (cells[ti] ?? "").trim();
    const slugRaw = (cells[si] ?? "").trim();
    const description = di >= 0 ? (cells[di] ?? "").trim() : "";
    const content = (cells[ci] ?? "").trim();
    if (!title || !slugRaw || !content) {
      failed++;
      continue;
    }
    const resolved = resolveSeoArticleWithAutoFix({ title, description, content });
    if (!resolved.ok) {
      failed++;
      continue;
    }
    const { content: finalContent, description: finalDescription, autoFixed } = resolved;
    try {
      const finalSlug = await allocateUniqueSlug(supabase, slugRaw);
      const now = new Date().toISOString();
      const { error } = await supabase.from("seo_articles").insert({
        title,
        slug: finalSlug,
        description: finalDescription || null,
        content: finalContent,
        status: "published",
        created_at: now,
        updated_at: now
      });
      if (error) {
        console.error("[admin/import] row", r, error);
        failed++;
      } else {
        inserted++;
        if (autoFixed) fixed++;
      }
    } catch {
      failed++;
    }
  }

  const payload = { ok: true as const, inserted, fixed, failed };
  const origin = redirectOrigin(request);
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html") && origin) {
    const basePath = returnToRaw.startsWith("/admin/") ? returnToRaw : "/admin/import";
    const u = new URL(basePath, origin);
    u.searchParams.set("inserted", String(inserted));
    u.searchParams.set("failed", String(failed));
    u.searchParams.set("fixed", String(fixed));
    u.searchParams.set("ok", "1");
    return NextResponse.redirect(u.toString());
  }
  return NextResponse.json(payload);
}
