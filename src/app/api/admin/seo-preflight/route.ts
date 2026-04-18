import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { loadScenarioTopicRows } from "@/lib/seo-preflight/adapters/load-scenario-topics";
import {
  runSeoPreflightJob,
  SEO_PREFLIGHT_CONTENT_TYPES,
  type SeoPreflightConfig,
  type SeoPreflightContentType
} from "@/lib/seo-preflight";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseConfig(body: unknown): { ok: true; config: SeoPreflightConfig } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_json" };
  const o = body as Record<string, unknown>;
  const targetCount = Number(o.targetCount);
  if (!Number.isFinite(targetCount) || targetCount < 0 || targetCount > 500) {
    return { ok: false, error: "targetCount_invalid" };
  }
  const market = typeof o.market === "string" ? o.market.trim() : "";
  const locale = typeof o.locale === "string" ? o.locale.trim() : "";
  const contentLanguage = typeof o.contentLanguage === "string" ? o.contentLanguage.trim() : "";
  const site = typeof o.site === "string" ? o.site.trim() : undefined;
  if (!market || !locale || !contentLanguage) return { ok: false, error: "market_locale_language_required" };
  const ct = o.contentType;
  if (typeof ct !== "string" || !SEO_PREFLIGHT_CONTENT_TYPES.includes(ct as SeoPreflightContentType)) {
    return { ok: false, error: "contentType_invalid" };
  }
  const maxEstimatedCost =
    o.maxEstimatedCost === undefined || o.maxEstimatedCost === null
      ? undefined
      : Number(o.maxEstimatedCost);
  if (maxEstimatedCost !== undefined && (!Number.isFinite(maxEstimatedCost) || maxEstimatedCost < 0)) {
    return { ok: false, error: "maxEstimatedCost_invalid" };
  }
  const draftMode = typeof o.draftMode === "boolean" ? o.draftMode : undefined;
  const config: SeoPreflightConfig = {
    targetCount,
    market,
    locale,
    contentLanguage,
    contentType: ct as SeoPreflightContentType,
    site: site || undefined,
    draftMode,
    maxEstimatedCost
  };
  return { ok: true, config };
}

export async function GET() {
  const adminUser = await isAdmin();
  if (!adminUser) return new Response("Unauthorized", { status: 401 });
  return Response.json({ ok: true, route: "admin/seo-preflight", method: "POST" });
}

export async function POST(request: Request) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseConfig(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const bodyObj = body as Record<string, unknown>;
  const manualSeeds = Array.isArray(bodyObj.candidateSeeds)
    ? bodyObj.candidateSeeds
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .map((s) => s.trim())
    : [];

  const fromScenario =
    bodyObj.useScenarioTopicsFile === true ? await loadScenarioTopicRows(process.cwd()) : [];
  const candidateSeedRows = [
    ...fromScenario,
    ...manualSeeds.map((topic) => ({ topic }))
  ];

  const seedsOnly = bodyObj.seedsOnly === true;
  const persistLog = typeof bodyObj.persistLog === "boolean" ? bodyObj.persistLog : true;

  try {
    const result = await runSeoPreflightJob(parsed.config, {
      candidateSeedRows,
      persistLog,
      seedsOnly
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[seo-preflight]", msg);
    return NextResponse.json({ ok: false, error: "preflight_failed", detail: msg }, { status: 500 });
  }
}
