import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getToolForSubmit } from "@/config/submit-content";
import type { SubmitPlatform, SubmitContentType } from "@/config/submit-content";

function generateSlug(toolSlug: string, content: string): string {
  const keyword = content
    .slice(0, 100)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 30) || "example";
  const shortId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `${toolSlug}-${keyword}-${shortId}`;
}

const VALID_PLATFORMS: SubmitPlatform[] = ["tiktok", "youtube", "instagram"];
const VALID_CONTENT_TYPES: SubmitContentType[] = ["caption", "hook", "title"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const platform = typeof body.platform === "string" ? body.platform.trim().toLowerCase() : "";
    const contentType = typeof body.contentType === "string" ? body.contentType.trim().toLowerCase() : "caption";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const creatorName = typeof body.creatorName === "string" ? body.creatorName.trim().slice(0, 100) : null;

    if (!platform || !VALID_PLATFORMS.includes(platform as SubmitPlatform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    if (!content || content.length > 2000) {
      return NextResponse.json({ error: "Content is required and must be under 2000 characters" }, { status: 400 });
    }
    if (contentType && !VALID_CONTENT_TYPES.includes(contentType as SubmitContentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    const { slug, name } = getToolForSubmit(platform as SubmitPlatform, (contentType as SubmitContentType) || "caption");
    const exampleSlug = generateSlug(slug, content);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("public_examples")
      .insert({
        tool_slug: slug,
        tool_name: name,
        input: content.slice(0, 100),
        result: content,
        creator_username: creatorName || null,
        creator_id: null,
        source: "submitted",
        slug: exampleSlug
      })
      .select("slug")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Duplicate submission" }, { status: 409 });
      }
      console.error("submit-example error:", error);
      return NextResponse.json({ error: "Submission failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, slug: data?.slug ?? exampleSlug });
  } catch (err) {
    console.error("submit-example error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
