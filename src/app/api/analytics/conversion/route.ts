import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * V96: Server-side conversion logging (extend with DB / Plausible later).
 */
const ALLOWED = new Set([
  "upgrade_click",
  "pricing_open",
  "payment_click",
  // V104.3 — Douyin funnel
  "douyin_tool_view",
  "douyin_generate",
  "douyin_locked_content_view",
  "douyin_upgrade_click",
  "douyin_payment_success",
  // V104.3 — Non-douyin (cn "global") funnel
  "cn_tool_view",
  "cn_generate",
  "cn_locked_content_view",
  "cn_upgrade_click",
  "cn_payment_success",
  "tool_share_link_copy"
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const event = typeof body.event === "string" ? body.event : "";
    if (!ALLOWED.has(event)) {
      return NextResponse.json({ ok: false, error: "invalid event" }, { status: 400 });
    }

    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
    const href = typeof body.href === "string" ? body.href : "";
    const country = request.headers.get("x-country") ?? request.headers.get("cf-ipcountry");

    const supabase = await createClient();
    const { error } = await supabase.from("traffic_events").insert({
      source: "conversion_funnel",
      page: event.slice(0, 80),
      meta: {
        ...metadata,
        href: href ? href.slice(0, 2048) : null,
        country: country ? String(country).slice(0, 10) : null,
        ua: request.headers.get("user-agent")?.slice(0, 200) ?? null,
        t: new Date().toISOString()
      }
    });

    if (error) {
      // Table might be missing in some environments; do not break user UX.
      console.error("[conversion] insert traffic_events failed:", error);
      return NextResponse.json({ ok: true, skipped: true });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
