import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import {
  mergeSeedsIntoStore,
  readAppSeoSeedStore,
  validateSeedStore,
  writeAppSeoSeedStore,
  parseSeoSeedsCsv
} from "@/lib/seo-seed-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const store = await readAppSeoSeedStore();
  return NextResponse.json({ ok: true, store, path: "data/app-seo-seeds.json" });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("text/csv")) {
    const text = await request.text();
    const parsed = parseSeoSeedsCsv(text);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }
    try {
      const store = await mergeSeedsIntoStore(parsed.seeds as unknown[], "merge");
      return NextResponse.json({ ok: true, store, imported: parsed.seeds.length });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const mode = body.mode === "replace" ? "replace" : "merge";
  if (typeof body.rawStore === "object" && body.rawStore !== null) {
    const v = validateSeedStore(body.rawStore);
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
    if (mode === "replace") {
      await writeAppSeoSeedStore(v.store);
    } else {
      await mergeSeedsIntoStore(v.store.seeds as unknown[], "merge");
    }
    const store = await readAppSeoSeedStore();
    return NextResponse.json({ ok: true, store });
  }

  if (Array.isArray(body.seeds)) {
    try {
      const store = await mergeSeedsIntoStore(body.seeds as unknown[], mode);
      return NextResponse.json({ ok: true, store });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
  }

  if (typeof body.rawCsv === "string") {
    const parsed = parseSeoSeedsCsv(body.rawCsv);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    try {
      const store = await mergeSeedsIntoStore(parsed.seeds as unknown[], mode);
      return NextResponse.json({ ok: true, store, imported: parsed.seeds.length });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: false, error: "expected seeds[], rawStore, rawCsv, or CSV body" }, { status: 400 });
}
