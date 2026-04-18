import type { SupabaseClient } from "@supabase/supabase-js";

export type ScheduleSeoPublishOptions = {
  /** Max articles scheduled per UTC calendar day (cadence). Default 5. */
  dailyMax?: number;
  /** UTC hours for slot0..dailyMax-1 within a day (length should be >= dailyMax). */
  hourSlotsUtc?: number[];
  /** Stored in publish_queue_source. */
  source?: string;
};

export type ScheduledPublishAssignment = {
  articleId: string;
  publishScheduledAt: string;
};

function utcYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addUtcDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function atUtcHour(ymd: string, hour: number): Date {
  const [y, m, day] = ymd.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y!, m! - 1, day!, hour, 0, 0, 0));
}

/**
 * Assign staggered `publish_scheduled_at` (UTC) and set `status=scheduled`.
 * Respects existing `scheduled` rows per day so multiple runs do not burst past `dailyMax`.
 */
export async function scheduleSeoArticlesForPublish(
  db: SupabaseClient,
  articleIds: string[],
  options?: ScheduleSeoPublishOptions
): Promise<{ scheduled: ScheduledPublishAssignment[]; skipped: string[] }> {
  const dailyMax = Math.max(1, Math.min(10, options?.dailyMax ?? 5));
  const defaultSlots = [9, 11, 13, 15, 17, 19, 21, 22].slice(0, dailyMax);
  const hourSlots = (options?.hourSlotsUtc?.length ? options.hourSlotsUtc : defaultSlots).slice(0, dailyMax);
  while (hourSlots.length < dailyMax) {
    hourSlots.push(12 + hourSlots.length * 2);
  }
  const source = options?.source ?? "schedule";

  const ids = [...new Set(articleIds.map((x) => x.trim()).filter(Boolean))];
  const scheduled: ScheduledPublishAssignment[] = [];
  const skipped: string[] = [];

  if (ids.length === 0) {
    return { scheduled, skipped };
  }

  const now = new Date();
  const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const rangeEnd = addUtcDays(rangeStart, 120);

  const { data: existingRows, error: fetchErr } = await db
    .from("seo_articles")
    .select("publish_scheduled_at")
    .eq("status", "scheduled")
    .eq("deleted", false)
    .not("publish_scheduled_at", "is", null)
    .gte("publish_scheduled_at", rangeStart.toISOString())
    .lte("publish_scheduled_at", rangeEnd.toISOString());

  if (fetchErr) {
    throw new Error(`scheduleSeoArticlesForPublish: ${fetchErr.message}`);
  }

  const perDay = new Map<string, number>();
  for (const r of existingRows ?? []) {
    const raw = (r as { publish_scheduled_at?: string }).publish_scheduled_at;
    if (!raw) continue;
    const day = raw.slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }

  const nextSlot = (): Date => {
    for (let dayOff = 0; dayOff < 120; dayOff++) {
      const dayDate = addUtcDays(rangeStart, dayOff);
      const dayStr = utcYmd(dayDate);
      const used = perDay.get(dayStr) ?? 0;
      if (used < dailyMax) {
        const hour = hourSlots[used] ?? 15;
        perDay.set(dayStr, used + 1);
        return atUtcHour(dayStr, hour);
      }
    }
    return atUtcHour(utcYmd(addUtcDays(rangeStart, 119)), hourSlots[0] ?? 12);
  };

  for (const id of ids) {
    const { data: row, error: oneErr } = await db
      .from("seo_articles")
      .select("id, status, deleted")
      .eq("id", id)
      .maybeSingle();

    if (oneErr || !row) {
      skipped.push(id);
      continue;
    }
    const st = String((row as { status?: string }).status ?? "");
    const del = (row as { deleted?: boolean }).deleted === true;
    if (del || st === "published" || st === "scheduled") {
      skipped.push(id);
      continue;
    }
    if (st !== "draft") {
      skipped.push(id);
      continue;
    }

    const when = nextSlot();
    const { error: upErr } = await db
      .from("seo_articles")
      .update({
        status: "scheduled",
        publish_scheduled_at: when.toISOString(),
        publish_queue_source: source,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (upErr) {
      skipped.push(id);
      continue;
    }

    scheduled.push({ articleId: id, publishScheduledAt: when.toISOString() });
  }

  return { scheduled, skipped };
}

export type ProcessDueScheduledOptions = {
  /** Max rows to publish in one cron invocation (anti-burst). Default 3. */
  maxPerRun?: number;
};

/**
 * Promote due `scheduled` rows to `published`. Idempotent per row.
 */
export async function processDueScheduledSeoPublishes(
  db: SupabaseClient,
  options?: ProcessDueScheduledOptions
): Promise<{ publishedIds: string[]; errors: string[] }> {
  const maxPerRun = Math.max(1, Math.min(20, options?.maxPerRun ?? 3));
  const nowIso = new Date().toISOString();
  const publishedIds: string[] = [];
  const errors: string[] = [];

  const { data: due, error: fetchErr } = await db
    .from("seo_articles")
    .select("id")
    .eq("status", "scheduled")
    .eq("deleted", false)
    .lte("publish_scheduled_at", nowIso)
    .order("publish_scheduled_at", { ascending: true })
    .limit(maxPerRun);

  if (fetchErr) {
    errors.push(fetchErr.message);
    return { publishedIds, errors };
  }

  const ts = new Date().toISOString();
  for (const r of due ?? []) {
    const id = String((r as { id?: string }).id ?? "");
    if (!id) continue;
    const { error } = await db
      .from("seo_articles")
      .update({
        status: "published",
        publish_scheduled_at: null,
        publish_queue_source: null,
        updated_at: ts
      })
      .eq("id", id)
      .eq("status", "scheduled");

    if (error) {
      errors.push(`${id}:${error.message}`);
      continue;
    }
    publishedIds.push(id);
  }

  return { publishedIds, errors };
}
