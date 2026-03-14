import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [favoritesRes, historyRes] = await Promise.all([
    supabase
      .from("favorites")
      .select("id, tool_slug, tool_name, text, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .limit(50),
    supabase
      .from("generation_history")
      .select("id, tool_slug, tool_name, input, items, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const favorites = (favoritesRes.data ?? []).map((r) => ({
    id: r.id,
    toolSlug: r.tool_slug,
    toolName: r.tool_name,
    text: r.text,
    savedAt: new Date(r.saved_at).getTime()
  }));

  const history = (historyRes.data ?? []).map((r) => ({
    id: r.id,
    toolSlug: r.tool_slug,
    toolName: r.tool_name,
    input: r.input,
    items: (r.items as string[]) ?? [],
    timestamp: new Date(r.created_at).getTime()
  }));

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      favorites={favorites}
      history={history}
    />
  );
}
