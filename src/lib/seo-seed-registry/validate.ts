import type { AppSeoSeedRecord, AppSeoSeedStore } from "./types";

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((i) => typeof i === "string");
}

export function validateSeedRecord(raw: unknown, index: number): { ok: true; seed: AppSeoSeedRecord } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: `seed[${index}]: not an object` };
  }
  const o = raw as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return { ok: false, error: `seed[${index}]: id required` };
  if (!isNonEmptyString(o.feature)) return { ok: false, error: `seed[${index}]: feature required` };
  if (!isNonEmptyString(o.platform)) return { ok: false, error: `seed[${index}]: platform required` };
  if (!isStringArray(o.keywords) || o.keywords.length === 0) {
    return { ok: false, error: `seed[${index}]: keywords must be a non-empty string array` };
  }
  const keywords = o.keywords.map((k) => k.trim()).filter(Boolean);
  if (keywords.length === 0) return { ok: false, error: `seed[${index}]: keywords empty after trim` };

  const steps = isStringArray(o.steps) ? o.steps.map((s) => s.trim()).filter(Boolean) : [];
  const angles = isStringArray(o.angles) ? o.angles.map((s) => s.trim()).filter(Boolean) : [];
  const markets = isStringArray(o.markets) ? o.markets.map((s) => s.trim()).filter(Boolean) : [];
  const languages = isStringArray(o.languages) ? o.languages.map((s) => s.trim()).filter(Boolean) : [];

  const notes = isNonEmptyString(o.notes) ? o.notes.trim() : undefined;
  const sellingPoints =
    isStringArray(o.sellingPoints) && o.sellingPoints.length > 0
      ? o.sellingPoints.map((s) => s.trim()).filter(Boolean)
      : undefined;

  return {
    ok: true,
    seed: {
      id: o.id.trim(),
      feature: o.feature.trim(),
      platform: o.platform.trim(),
      keywords,
      steps,
      angles,
      markets,
      languages,
      notes,
      sellingPoints
    }
  };
}

function parseStoreVersion(v: unknown): number | string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }
  const n = Number(v);
  if (Number.isFinite(n) && n >= 1) return n;
  return null;
}

export function validateSeedStore(raw: unknown): { ok: true; store: AppSeoSeedStore } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "root must be an object" };
  const o = raw as Record<string, unknown>;
  const version = parseStoreVersion(o.version);
  if (version === null) {
    return { ok: false, error: "version must be a number >= 1 or a non-empty string" };
  }
  if (!Array.isArray(o.seeds)) return { ok: false, error: "seeds must be an array" };

  const seeds: AppSeoSeedRecord[] = [];
  const ids = new Set<string>();
  for (let i = 0; i < o.seeds.length; i++) {
    const v = validateSeedRecord(o.seeds[i], i);
    if (!v.ok) return v;
    if (ids.has(v.seed.id)) return { ok: false, error: `duplicate seed id: ${v.seed.id}` };
    ids.add(v.seed.id);
    seeds.push(v.seed);
  }

  return {
    ok: true,
    store: {
      version,
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
      seeds
    }
  };
}
