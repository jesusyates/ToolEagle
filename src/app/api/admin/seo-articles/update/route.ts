import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isMissingCoverColumnSupabaseError,
  normalizeCoverImageAltForStorage,
  normalizeCoverImageUrlForStorage
} from "@/lib/seo/article-cover";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeSlug(raw: string): string {
  return (
    raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "guide"
  );
}

export async function POST(request: Request) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    title?: unknown;
    slug?: unknown;
    description?: unknown;
    content?: unknown;
    cover_image?: unknown;
    cover_image_alt?: unknown;
  } | null;

  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const slugRaw = typeof body?.slug === "string" ? body.slug : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const content = typeof body?.content === "string" ? body.content : "";
  const coverImageRaw = typeof body?.cover_image === "string" ? body.cover_image : "";
  const coverAltRaw = typeof body?.cover_image_alt === "string" ? body.cover_image_alt : "";
  const cover_image = normalizeCoverImageUrlForStorage(coverImageRaw);
  const cover_image_alt =
    cover_image === null ? null : normalizeCoverImageAltForStorage(coverAltRaw);
  if (coverImageRaw.trim().length > 0 && cover_image === null) {
    return NextResponse.json({ ok: false, error: "cover_image_invalid" }, { status: 400 });
  }

  if (!id || !title || !slugRaw) {
    return NextResponse.json({ ok: false, error: "id_title_slug_required" }, { status: 400 });
  }

  const slug = normalizeSlug(slugRaw);
  const now = new Date().toISOString();
  const payloadBase = {
    title,
    slug,
    description: description.length > 0 ? description : null,
    content,
    updated_at: now
  };
  const payloadWithCover = {
    ...payloadBase,
    cover_image,
    cover_image_alt
  };

  async function tryUpdate(
    db: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>,
    payload: typeof payloadWithCover | typeof payloadBase
  ) {
    const { data: other } = await db.from("seo_articles").select("id").eq("slug", slug).maybeSingle();
    if (other && (other as { id: string }).id !== id) {
      return { ok: false as const, kind: "slug_taken" as const, error: null as null };
    }
    /** 必须 .select：否则 0 行更新时 PostgREST 仍可能 error=null，会误报「已保存」。 */
    const { data: updated, error } = await db
      .from("seo_articles")
      .update(payload)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) {
      return { ok: false as const, kind: undefined as undefined, error };
    }
    if (!updated) {
      return {
        ok: false as const,
        kind: undefined as undefined,
        error: {
          message:
            "no_rows_updated: RLS 拒绝或未找到该行。请配置 SUPABASE_SERVICE_ROLE_KEY，或在 Supabase 执行 0048_seo_articles_admin_rls.sql 后用管理员账号保存。"
        }
      };
    }
    return { ok: true as const, kind: undefined as undefined, error: null as null };
  }

  let first = await tryUpdate(createAdminClient(), payloadWithCover);
  if (!first.ok && first.error && isMissingCoverColumnSupabaseError(first.error)) {
    first = await tryUpdate(createAdminClient(), payloadBase);
  }
  if (first.kind === "slug_taken") {
    return NextResponse.json({ ok: false, error: "slug_taken" }, { status: 409 });
  }
  if (first.ok) {
    return NextResponse.json({ ok: true, slug });
  }
  console.error("[seo-articles/update] createAdminClient failed, retrying with session", first.error);

  let second = await tryUpdate(await createClient(), payloadWithCover);
  if (!second.ok && second.error && isMissingCoverColumnSupabaseError(second.error)) {
    second = await tryUpdate(await createClient(), payloadBase);
  }
  if (second.kind === "slug_taken") {
    return NextResponse.json({ ok: false, error: "slug_taken" }, { status: 409 });
  }
  if (second.ok) {
    return NextResponse.json({ ok: true, slug });
  }
  console.error("[seo-articles/update]", second.error);
  return NextResponse.json(
    { ok: false, error: "update_failed", detail: second.error?.message },
    { status: 500 }
  );
}
