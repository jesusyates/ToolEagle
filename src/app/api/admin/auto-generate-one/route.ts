import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { deepseekProvider } from "@/lib/ai/providers/deepseek";
import { rebuildToSeoArticle } from "@/lib/seo/rebuild-article";
import { resolveSeoArticleWithAutoFix } from "@/lib/seo/seo-gate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RUN_TYPE = "auto_generate_one";

export async function GET() {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json({ ok: true, route: "admin/auto-generate-one", method: "POST" });
}

/** Default guide title when the request body omits `title`. */
const DEFAULT_GUIDE_TITLE =
  "How I plan TikTok content when I have no ideas midweek (what actually worked)";

type JsonResult = {
  ok: boolean;
  published: boolean;
  slug: string | null;
  title: string | null;
  fail_reason: string | null;
};

async function allocateUniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  base: string
): Promise<string> {
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

async function persistLog(
  admin: ReturnType<typeof createAdminClient>,
  row: {
    status: "success" | "failed";
    fail_reason: string | null;
    title: string | null;
    slug: string | null;
  }
): Promise<void> {
  const { error } = await admin.from("admin_run_logs").insert({
    run_type: RUN_TYPE,
    status: row.status,
    fail_reason: row.fail_reason,
    title: row.title,
    slug: row.slug,
    created_at: new Date().toISOString()
  });
  if (error) {
    console.error("[auto-generate-one] admin_run_logs insert failed", error);
  }
}

function isProviderUnavailableError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("http 402") ||
    m.includes("insufficient balance") ||
    m.includes("rebuild_provider_insufficient_balance") ||
    m.includes("deepseek_api_key not configured") ||
    m.includes("deepseek_api_key missing")
  );
}

export async function POST(request: Request): Promise<NextResponse<JsonResult>> {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return NextResponse.json(
      { ok: false, published: false, slug: null, title: null, fail_reason: "unauthorized" },
      { status: 401 }
    );
  }

  let titleSeed = DEFAULT_GUIDE_TITLE;
  try {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const j = (await request.json().catch(() => null)) as { title?: unknown } | null;
      if (typeof j?.title === "string" && j.title.trim().length > 0) {
        titleSeed = j.title.trim().slice(0, 300);
      }
    }
  } catch {
    /* use default */
  }

  const admin = createAdminClient();

  const usable = await deepseekProvider.healthCheck();
  if (!usable) {
    await persistLog(admin, {
      status: "failed",
      fail_reason: "provider_unavailable",
      title: titleSeed,
      slug: null
    });
    return NextResponse.json({
      ok: false,
      published: false,
      slug: null,
      title: titleSeed,
      fail_reason: "provider_unavailable"
    });
  }

  let rebuilt: Awaited<ReturnType<typeof rebuildToSeoArticle>>;
  try {
    rebuilt = await rebuildToSeoArticle({
      title: titleSeed,
      contentType: "guide",
      language: "en"
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const fr = isProviderUnavailableError(msg) ? "provider_unavailable" : "generation_failed";
    await persistLog(admin, {
      status: "failed",
      fail_reason: fr,
      title: titleSeed,
      slug: null
    });
    return NextResponse.json({
      ok: false,
      published: false,
      slug: null,
      title: titleSeed,
      fail_reason: fr
    });
  }

  const resolved = resolveSeoArticleWithAutoFix({
    title: rebuilt.title,
    description: rebuilt.aiSummary ?? "",
    content: rebuilt.body
  });

  if (!resolved.ok) {
    const detail = resolved.reasons.slice(0, 5).join(" | ");
    await persistLog(admin, {
      status: "failed",
      fail_reason: `seo_gate_failed: ${detail}`,
      title: rebuilt.title,
      slug: null
    });
    return NextResponse.json({
      ok: false,
      published: false,
      slug: null,
      title: rebuilt.title,
      fail_reason: "seo_gate_failed"
    });
  }

  const baseFromTitle = rebuilt.title;
  const finalSlug = await allocateUniqueSlug(admin, baseFromTitle);
  const now = new Date().toISOString();

  const { error } = await admin.from("seo_articles").insert({
    title: rebuilt.title,
    slug: finalSlug,
    description: resolved.description || null,
    content: resolved.content,
    status: "published",
    created_at: now,
    updated_at: now
  });

  if (error) {
    console.error("[auto-generate-one] seo_articles insert", error);
    await persistLog(admin, {
      status: "failed",
      fail_reason: "db_insert_failed",
      title: rebuilt.title,
      slug: finalSlug
    });
    return NextResponse.json({
      ok: false,
      published: false,
      slug: null,
      title: rebuilt.title,
      fail_reason: "db_insert_failed"
    });
  }

  await persistLog(admin, {
    status: "success",
    fail_reason: null,
    title: rebuilt.title,
    slug: finalSlug
  });

  return NextResponse.json({
    ok: true,
    published: true,
    slug: finalSlug,
    title: rebuilt.title,
    fail_reason: null
  });
}
