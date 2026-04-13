import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { readAppSeoSeedStore } from "@/lib/seo-seed-registry";
import { mapSeedsToScenarioTopics, writeScenarioTopicsJson } from "@/lib/seo-scenario-mapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let defaultMarket = "global";
  let defaultLocale = "en";
  let defaultContentLanguage = "en";
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.defaultMarket === "string" && body.defaultMarket.trim()) defaultMarket = body.defaultMarket.trim();
    if (typeof body.defaultLocale === "string" && body.defaultLocale.trim()) defaultLocale = body.defaultLocale.trim();
    if (typeof body.defaultContentLanguage === "string" && body.defaultContentLanguage.trim()) {
      defaultContentLanguage = body.defaultContentLanguage.trim();
    }
  } catch {
    /* use defaults */
  }

  const store = await readAppSeoSeedStore();
  if (store.seeds.length === 0) {
    return NextResponse.json({ ok: false, error: "no_seeds" }, { status: 400 });
  }

  const mapped = mapSeedsToScenarioTopics(store.seeds, {
    defaultMarket,
    defaultLocale,
    defaultContentLanguage
  });
  const doc = await writeScenarioTopicsJson(mapped.topics);
  return NextResponse.json({
    ok: true,
    topicCount: doc.topicCount,
    deduped: mapped.deduped,
    path: "generated/seo-scenario-topics.json",
    preview: doc.topics.slice(0, 12)
  });
}
