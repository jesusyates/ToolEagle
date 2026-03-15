import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const platform = typeof body.platform === "string" ? body.platform.trim() : "";
  const handle = typeof body.handle === "string" ? body.handle.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!platform || !handle || !email) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const validPlatforms = ["tiktok", "youtube", "instagram"];
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("creator_invites").insert({
      platform,
      handle,
      email
    });

    if (error) {
      console.error("creator-invite error:", error);
      return NextResponse.json({ error: "Submission failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("creator-invite error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
