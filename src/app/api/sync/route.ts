import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type SyncPayload = {
  favorites: Array<{ toolSlug: string; toolName: string; text: string; savedAt: number }>;
  history: Array<{
    toolSlug: string;
    toolName: string;
    input: string;
    items: string[];
    timestamp: number;
  }>;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SyncPayload;
  const { favorites = [], history = [] } = body;

  const userId = user.id;

  if (favorites.length > 0) {
    const toInsert = favorites.map((f) => ({
      user_id: userId,
      tool_slug: f.toolSlug,
      tool_name: f.toolName,
      text: f.text,
      saved_at: new Date(f.savedAt).toISOString()
    }));
    await supabase.from("favorites").insert(toInsert);
  }

  if (history.length > 0) {
    const toInsert = history.map((h) => ({
      user_id: userId,
      tool_slug: h.toolSlug,
      tool_name: h.toolName,
      input: h.input,
      items: h.items,
      created_at: new Date(h.timestamp).toISOString()
    }));
    const { error } = await supabase.from("generation_history").insert(toInsert);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
