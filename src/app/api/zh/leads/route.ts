import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { getWelcomeEmailHtml, WELCOME_EMAIL_SUBJECT } from "@/lib/zh-welcome-email";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

async function sendWelcomeEmail(to: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: WELCOME_EMAIL_SUBJECT,
      html: getWelcomeEmailHtml()
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
    await sendWelcomeEmail(email);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[zh/leads] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
