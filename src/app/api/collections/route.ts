import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("collections")
      .select("id, name, slug, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ collections: data ?? [] });
  } catch (error) {
    console.error("[api/collections] API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "collection";

    const { data, error } = await supabase
      .from("collections")
      .insert({ user_id: user.id, name: name.trim(), slug })
      .select("id, name, slug")
      .single();

    if (error) {
      if (error.code === "23505") {
        const slug2 = `${slug}-${Date.now().toString(36)}`;
        const { data: d2, error: e2 } = await supabase
          .from("collections")
          .insert({ user_id: user.id, name: name.trim(), slug: slug2 })
          .select("id, name, slug")
          .single();
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
        return NextResponse.json({ collection: d2 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ collection: data });
  } catch (error) {
    console.error("[api/collections] API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
