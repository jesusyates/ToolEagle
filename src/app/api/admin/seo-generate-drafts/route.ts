import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth/isAdmin";
import { generateSeoDraftsFromPreflight } from "@/lib/seo-draft-generation";
import type { SeoPreflightCandidateResult, SeoPreflightJobResult } from "@/lib/seo-preflight";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const adminUser = await isAdmin();
  if (!adminUser) return new Response("Unauthorized", { status: 401 });
  return Response.json({ ok: true, route: "admin/seo-generate-drafts", method: "POST" });
}

function isApprovedList(x: unknown): x is SeoPreflightCandidateResult[] {
  return Array.isArray(x) && x.length > 0 && typeof (x[0] as SeoPreflightCandidateResult)?.title === "string";
}

export async function POST(request: Request) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  } catch {
    body = {};
  }

  let approved: SeoPreflightCandidateResult[] = [];
  let source: "request_body" | "preflight_file" = "request_body";

  if (isApprovedList(body.approved)) {
    approved = body.approved.filter((r) => r.approved === true);
    source = "request_body";
  }

  if (approved.length === 0 && body.useLastPreflightFile === true) {
    const filePath = path.join(process.cwd(), "generated", "seo-preflight-last-run.json");
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const j = JSON.parse(raw) as SeoPreflightJobResult;
      approved = (j.approved ?? []).filter((r) => r.approved === true);
      source = "preflight_file";
    } catch {
      return NextResponse.json({ ok: false, error: "preflight_file_missing_or_invalid" }, { status: 400 });
    }
  }

  if (approved.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no_approved_candidates_pass_body_approved_or_useLastPreflightFile" },
      { status: 400 }
    );
  }

  try {
    const result = await generateSeoDraftsFromPreflight(approved, { source, persistLog: true });
    revalidatePath("/admin/seo");
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[seo-generate-drafts]", msg);
    return NextResponse.json({ ok: false, error: "draft_generation_failed", detail: msg }, { status: 500 });
  }
}
