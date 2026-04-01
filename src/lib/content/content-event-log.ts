import { createAdminClient } from "@/lib/supabase/admin";

export async function logContentEventServer(payload: Record<string, unknown>): Promise<void> {
  try {
    const supabase = createAdminClient();
    const base = {
      content_id:
        typeof payload.content_id === "string" && payload.content_id
          ? payload.content_id
          : `evt-${Date.now()}-${Math.random()}`,
      event_type: String(payload.event_type ?? "unknown")
    };
    const full = { ...payload, ...base };
    let { error } = await supabase.from("content_events").insert(full as any);
    if (error && /column .* does not exist/i.test(String(error.message || ""))) {
      ({ error } = await supabase.from("content_events").insert(base as any));
    }
    if (error) {
      console.error("[content-event-log] insert failed", error.message);
    }
  } catch (e) {
    console.error("[content-event-log] fatal", e);
  }
}

