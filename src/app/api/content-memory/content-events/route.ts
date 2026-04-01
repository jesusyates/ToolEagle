import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ContentEventInsertPayload = {
  content_id: string;
  event_type: string;
  pattern_source?: "user" | "default";
  patterns_used?: unknown;
  stage?: "new" | "growing" | "monetizing";
  problems_used?: unknown;
  suggestions_used?: unknown;
  actions?: unknown;
  priority?: "low" | "medium" | "high";
  current_priority?: "low" | "medium" | "high";
  current_focus?: string;
  next_actions?: unknown;
  summary?: string;
  tool_slug?: string;
  source?: "fresh" | "cached";
  route_kind?: "generate_package" | "direct_route";
  should_refresh?: boolean;
  reason?: string;
  trigger_score?: number;
  apply_score?: number;
  apply_level?: "weak" | "medium" | "strong";
  mode?: "minimal" | "standard" | "full";
  focus?: string;
  actions_used?: unknown;
  strategy_used?: unknown;
  hashtag_count?: number;
  caption_length_type?: string;
  top_hooks_used?: unknown;
  preferred_action?: string;
  tool_type?: "hook" | "caption" | "hashtag" | "title" | "other";
  context_lines?: unknown;
  ranked_lines?: unknown;
  top_line?: string;
  weight_score?: number;
  band?: "strong" | "medium" | "weak" | "empty";
};

const ALLOWED_EVENT_TYPES = new Set([
  "generate",
  "copy",
  "upload_redirect",
  "optimization_applied",
  "analysis_generated",
  "guidance_generated",
  "guidance_memory_applied",
  "creator_state_applied",
  "creator_state_snapshot",
  "creator_state_refresh_decision",
  "creator_state_trigger_scored",
  "creator_state_apply_scored",
  "creator_state_gated",
  "creator_state_scope_applied",
  "creator_state_strategy_built",
  "creator_state_tool_context_built",
  "creator_state_tool_weighted",
  "creator_state_tool_band_classified"
]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContentEventInsertPayload>;
    const content_id = typeof body?.content_id === "string" ? body.content_id.trim() : "";
    const event_type = body?.event_type;
    const pattern_source =
      body?.pattern_source === "user" || body?.pattern_source === "default" ? body.pattern_source : null;
    const patterns_used = body?.patterns_used;
    const stage =
      body?.stage === "new" || body?.stage === "growing" || body?.stage === "monetizing" ? body.stage : null;
    const problems_used = body?.problems_used;
    const suggestions_used = body?.suggestions_used;

    if (!content_id || !event_type || !ALLOWED_EVENT_TYPES.has(event_type)) {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const insertPayload: Record<string, unknown> = { ...body, content_id, event_type };
    if (event_type === "optimization_applied" && !("pattern_source" in insertPayload)) {
      insertPayload.pattern_source = pattern_source ?? "default";
    }

    let { error } = await supabase.from("content_events").insert(insertPayload as any);
    if (error && /column .* does not exist/i.test(String(error.message || ""))) {
      // Backward compatibility for minimal content_events schema.
      const fallback = await supabase.from("content_events").insert({ content_id, event_type } as any);
      error = fallback.error;
    }

    if (error) {
      if (
        error.code === "42P01" ||
        String(error.message || "").toLowerCase().includes("relation") ||
        String(error.message || "").toLowerCase().includes("does not exist")
      ) {
        return NextResponse.json({ ok: true, skipped: true, reason: "missing relation" });
      }
      console.error("[v196 content-events] insert failed", error);
      return NextResponse.json({ ok: false, error: "insert failed" }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[v196 content-events] fatal", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

