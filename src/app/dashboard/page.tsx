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

  const today = new Date().toISOString().slice(0, 10);
  const [favoritesRes, historyRes, usageRes, profileRes, projectsRes] = await Promise.all([
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
      .limit(20),
    supabase
      .from("usage_stats")
      .select("generations_count")
      .eq("user_id", user.id)
      .eq("date", today)
      .single(),
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
    supabase
      .from("projects")
      .select("id, name, created_at")
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

  const usageToday = usageRes.data?.generations_count ?? 0;
  let plan = profileRes.data?.plan ?? "free";

  const projects =
    projectsRes.error || !projectsRes.data
      ? []
      : projectsRes.data.map((r) => ({
          id: r.id,
          name: r.name,
          createdAt: new Date(r.created_at).getTime()
        }));

  if (!profileRes.data) {
    await supabase
      .from("profiles")
      .upsert({ id: user.id, plan: "free" }, { onConflict: "id", ignoreDuplicates: true });
  }

  return (
    <DashboardClient
      userEmail={user.email ?? ""}
      favorites={favorites}
      history={history}
      projects={projects}
      usageToday={usageToday}
      plan={plan}
    />
  );
}
