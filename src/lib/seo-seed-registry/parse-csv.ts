import type { AppSeoSeedRecord } from "./types";

function splitPipe(s: string): string[] {
  return s
    .split("|")
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Minimal CSV: header row required.
 * Columns: id,feature,platform,keywords,steps,angles,markets,languages,notes,sellingPoints
 * keywords/steps/angles/markets/languages/sellingPoints use | as separator inside cells.
 */
export function parseSeoSeedsCsv(text: string): { ok: true; seeds: AppSeoSeedRecord[] } | { ok: false; error: string } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { ok: false, error: "CSV needs header + at least one row" };

  const header = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const iId = idx("id");
  const iFeature = idx("feature");
  const iPlatform = idx("platform");
  const iKw = idx("keywords");
  if (iFeature < 0 || iPlatform < 0 || iKw < 0) {
    return { ok: false, error: "CSV must include columns: feature, platform, keywords (id optional)" };
  }

  const seeds: AppSeoSeedRecord[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r]!);
    const feature = (cells[iFeature] ?? "").trim();
    const platform = (cells[iPlatform] ?? "").trim();
    const keywords = splitPipe(cells[iKw] ?? "");
    if (!feature || !platform || keywords.length === 0) continue;

    const id =
      iId >= 0 && (cells[iId] ?? "").trim()
        ? (cells[iId] ?? "").trim()
        : `${feature}-${platform}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `seed-${r}`;

    const steps = idx("steps") >= 0 ? splitPipe(cells[idx("steps")] ?? "") : [];
    const angles = idx("angles") >= 0 ? splitPipe(cells[idx("angles")] ?? "") : [];
    const markets = idx("markets") >= 0 ? splitPipe(cells[idx("markets")] ?? "") : [];
    const languages = idx("languages") >= 0 ? splitPipe(cells[idx("languages")] ?? "") : [];
    const notes = idx("notes") >= 0 ? (cells[idx("notes")] ?? "").trim() : "";
    const sellingPoints = idx("sellingpoints") >= 0 ? splitPipe(cells[idx("sellingpoints")] ?? "") : [];

    seeds.push({
      id,
      feature,
      platform,
      keywords,
      steps,
      angles,
      markets,
      languages,
      notes: notes || undefined,
      sellingPoints: sellingPoints.length ? sellingPoints : undefined
    });
  }

  if (seeds.length === 0) return { ok: false, error: "no valid data rows" };
  return { ok: true, seeds };
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
