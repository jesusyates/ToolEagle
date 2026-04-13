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

export async function GET() {
  const admin = await isAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json({ ok: true, route: "admin/publish" });
}

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  let title = "";
  let slugInput = "";
  let description = "";
  let content = "";
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const j = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    title = typeof j?.title === "string" ? j.title : "";
    slugInput = typeof j?.slug === "string" ? j.slug : "";
    description = typeof j?.description === "string" ? j.description : "";
    content = typeof j?.content === "string" ? j.content : "";
  } else {
    const fd = await request.formData();
    title = String(fd.get("title") ?? "").trim();
    slugInput = String(fd.get("slug") ?? "").trim();
    description = String(fd.get("description") ?? "").trim();
    content = String(fd.get("content") ?? "");
  }

  if (!title || !slugInput || !content) {
    return NextResponse.json({ ok: false, error: "title, slug, and content are required" }, { status: 400 });
  }

  const resolved = resolveSeoArticleWithAutoFix({ title, description, content });
  if (!resolved.ok) {
    return NextResponse.json({ ok: false, reasons: resolved.reasons }, { status: 400 });
  }

  const { content: finalContent, description: finalDescription, autoFixed } = resolved;

  try {
    const supabase = createAdminClient();
    const finalSlug = await allocateUniqueSlug(supabase, slugInput);
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
      console.error("[admin/publish]", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const origin = redirectOrigin(request);
    if (ct.includes("application/json") || request.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ ok: true, slug: finalSlug, fixed: autoFixed });
    }
    if (origin) {
      return NextResponse.redirect(
        `${origin}/admin/publish?published=1&slug=${encodeURIComponent(finalSlug)}&fixed=${autoFixed ? "1" : "0"}`
      );
    }
    return NextResponse.json({ ok: true, slug: finalSlug, fixed: autoFixed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/publish]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
