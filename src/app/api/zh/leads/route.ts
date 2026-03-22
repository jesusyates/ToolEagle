import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { getWelcomeEmailHtml, WELCOME_EMAIL_SUBJECT } from "@/lib/zh-welcome-email";
import { getAffiliateTools } from "@/config/affiliate-tools";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

async function sendWelcomeEmail(to: string, keyword?: string | null): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const allTools = getAffiliateTools();
  const isMonetizationIntent = keyword && /赚钱|变现|引流|增长|涨粉/.test(keyword);
  const sorted = isMonetizationIntent
    ? [...allTools].sort((a, b) => {
        const aHigh = a.priceTier === "high-ticket" ? 1 : 0;
        const bHigh = b.priceTier === "high-ticket" ? 1 : 0;
        return bHigh - aHigh;
      })
    : allTools;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.tooleagle.com";
  const affiliateLinks = sorted
    .slice(0, 3)
    .map((t) => ({
      name: t.name,
      url: t.goSlug ? `${baseUrl}/go/${t.goSlug}` : t.url
    }));

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: WELCOME_EMAIL_SUBJECT,
      html: getWelcomeEmailHtml(affiliateLinks)
    });
    if (error) {
      console.error("[zh/leads] Resend error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[zh/leads] Send email error:", e);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("leads").insert({
      email,
      keyword: keyword || null
    });

    if (error) {
      console.error("[zh/leads] Insert error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    // V65: Send welcome email (5条爆款内容模板 + 1个工具推荐)
    // V70: Pass keyword for monetization-intent tool ordering
    await sendWelcomeEmail(email, keyword);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[zh/leads] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
