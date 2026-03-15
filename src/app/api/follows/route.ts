import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
  }

  const body = await request.json();
  const { username } = body;
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const { error } = await supabase.from("user_follows").insert({
    follower_id: user.id,
    following_username: username.trim().toLowerCase()
  });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, following: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 });

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_username", username.trim().toLowerCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, following: false });
}
