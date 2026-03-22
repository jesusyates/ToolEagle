/**
 * V92: Append revenue_attribution row (authenticated). Used for manual / webhook attribution.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOperatorUser } from "@/lib/auth/operator";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isOperatorUser(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const page = body?.page as string;
    const revenue = Number(body?.revenue ?? 0);
    const source = (body?.source as string) || null;
    const tool = (body?.tool as string) || null;

    if (!page || typeof page !== "string") {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }

    const { error } = await supabase.from("revenue_attribution").insert({
      page: page.slice(0, 500),
      revenue,
      source: source?.slice(0, 200) ?? null,
      tool: tool?.slice(0, 200) ?? null
    });

    if (error) {
      if (error.message?.includes("relation") || error.code === "42P01") {
        return NextResponse.json({ ok: true, skipped: true });
      }
      console.error("[revenue/attribution]", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[revenue/attribution]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
