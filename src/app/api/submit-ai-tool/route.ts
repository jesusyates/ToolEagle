import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";

  if (!name || !website || !description || !category) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (website.length > 500 || name.length > 200 || description.length > 2000) {
    return NextResponse.json({ error: "Invalid field length" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("ai_tool_submissions").insert({
      name,
      website,
      description,
      category
    });

    if (error) {
      console.error("submit-ai-tool error:", error);
      return NextResponse.json({ error: "Submission failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("submit-ai-tool error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
