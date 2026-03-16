import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ saved: false });
  }

  const { searchParams } = new URL(request.url);
  const exampleSlug = searchParams.get("exampleSlug");
  const answerSlug = searchParams.get("answerSlug");

  if (answerSlug) {
    const { data } = await supabase
      .from("user_saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("answer_slug", answerSlug)
      .single();
    return NextResponse.json({ saved: !!data, id: data?.id });
  }

  if (!exampleSlug) {
    return NextResponse.json({ saved: false });
  }

  const { data } = await supabase
    .from("user_saves")
    .select("id")
    .eq("user_id", user.id)
    .eq("example_slug", exampleSlug)
    .single();

  return NextResponse.json({ saved: !!data, id: data?.id });
}
