import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_PREFERRED_MARKET } from "@/config/market";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/feedback/constants";
import { insertUserFeedback } from "@/lib/feedback/insert-feedback";
import {
  applySupporterIdCookie,
  newSupporterId,
  readSupporterIdFromCookieStore
} from "@/lib/supporter/supporter-id";

function isCategory(s: string): s is FeedbackCategory {
  return (FEEDBACK_CATEGORIES as readonly string[]).includes(s);
}

function clamp(s: string, max: number): string {
  return s.trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const categoryRaw = typeof body.category === "string" ? body.category.trim() : "";
  if (!isCategory(categoryRaw)) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? clamp(body.message, 8000) : "";
  if (message.length < 3) {
    return NextResponse.json({ error: "message_required" }, { status: 400 });
  }

  const title =
    typeof body.title === "string" && body.title.trim().length > 0
      ? clamp(body.title, 200)
      : null;
  const contact =
    typeof body.contact === "string" && body.contact.trim().length > 0
      ? clamp(body.contact, 240)
      : null;

  const route =
    typeof body.route === "string" ? clamp(body.route, 400) : null;
  const sourcePage =
    typeof body.source_page === "string" ? clamp(body.source_page, 400) : route;
  const toolType =
    typeof body.tool_type === "string" ? clamp(body.tool_type, 120) : null;
  const userPlanRaw = typeof body.user_plan === "string" ? body.user_plan.trim() : "";
  const userPlan =
    userPlanRaw === "free" || userPlanRaw === "pro" ? userPlanRaw : null;

  const locale =
    typeof body.locale === "string" && body.locale.length <= 16
      ? body.locale.trim()
      : "en";

  let market = "global";
  if (body.market === "cn") market = "cn";
  else if (body.market === "global") market = "global";
  else {
    const c = request.cookies.get(COOKIE_PREFERRED_MARKET)?.value;
    if (c === "cn") market = "cn";
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let anonId: string | null = null;
  let setCookie = false;

  if (user) {
    anonId = user.id;
  } else {
    const existing = readSupporterIdFromCookieStore(request.cookies);
    if (existing) {
      anonId = existing;
    } else {
      anonId = newSupporterId();
      setCookie = true;
    }
  }

  const ins = await insertUserFeedback({
    anonymousUserId: anonId,
    market,
    locale,
    route,
    sourcePage,
    toolType,
    userPlan,
    category: categoryRaw,
    title,
    message,
    contact
  });

  if ("error" in ins) {
    return NextResponse.json(
      {
        error: "feedback_save_failed",
        detail: ins.error,
        hint: "Set SUPABASE_SERVICE_ROLE_KEY and run migration 0032_v100_3_user_feedback.sql"
      },
      { status: 503 }
    );
  }

  const res = NextResponse.json({ ok: true, id: ins.id });
  if (setCookie && anonId) {
    applySupporterIdCookie(res, anonId);
  }
  return res;
}
