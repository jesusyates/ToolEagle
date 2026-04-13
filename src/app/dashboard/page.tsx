import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { isOperatorUser } from "@/lib/auth/operator";
import { isAdmin } from "@/lib/auth/isAdmin";
import { DashboardClient } from "./DashboardClient";
import { isEnDashboardAllowedToolSlug } from "@/lib/en-dashboard-scope";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/dashboard"));
  }

  const today = new Date().toISOString().slice(0, 10);
  const [usageRes, profileRes, projectsRes] = await Promise.all([
    supabase
      .from("usage_stats")
      .select("generations_count")
      .eq("user_id", user.id)
      .eq("date", today)
      .single(),
    supabase.from("profiles").select("plan, plan_expire_at, onboarding_completed").eq("id", user.id).single(),
    supabase
      .from("projects")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  const market = "global";
  const favoritesAttempt: any = await supabase
    .from("favorites")
    .select("id, tool_slug, tool_name, text, saved_at")
    .eq("user_id", user.id)
    .eq("market", market)
    .order("saved_at", { ascending: false })
    .limit(50);

  const favoritesRows =
    favoritesAttempt.error?.message?.toLowerCase?.().includes("market")
      ? (
          await supabase
            .from("favorites")
            .select("id, tool_slug, tool_name, text, saved_at")
            .eq("user_id", user.id)
            .order("saved_at", { ascending: false })
            .limit(50)
        ).data ?? []
      : favoritesAttempt.data ?? [];

  const favorites = (favoritesRows as any[])
    .filter((r) => isEnDashboardAllowedToolSlug(r.tool_slug))
    .map((r) => ({
      id: r.id,
      toolSlug: r.tool_slug,
      toolName: r.tool_name,
      text: r.text,
      savedAt: new Date(r.saved_at).getTime()
    }));

  const historyAttempt: any = await supabase
    .from("generation_history")
    .select("id, tool_slug, tool_name, input, items, created_at")
    .eq("user_id", user.id)
    .eq("market", market)
    .order("created_at", { ascending: false })
    .limit(20);

  const historyRows =
    historyAttempt.error?.message?.toLowerCase?.().includes("market")
      ? (
          await supabase
            .from("generation_history")
            .select("id, tool_slug, tool_name, input, items, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20)
        ).data ?? []
      : historyAttempt.data ?? [];

  const history = (historyRows as any[])
    .filter((r) => isEnDashboardAllowedToolSlug(r.tool_slug))
    .map((r) => ({
      id: r.id,
      toolSlug: r.tool_slug,
      toolName: r.tool_name,
      input: r.input,
      items: (r.items as string[]) ?? [],
      timestamp: new Date(r.created_at).getTime()
    }));

  const usageToday = usageRes.data?.generations_count ?? 0;
  let plan = profileRes.data?.plan ?? "free";
  const exp = (profileRes.data as { plan_expire_at?: string | null } | null)?.plan_expire_at;
  if (plan === "pro" && exp) {
    if (new Date(exp).getTime() <= Date.now()) plan = "free";
  }
  const onboardingCompleted = (profileRes.data as { onboarding_completed?: boolean } | null)?.onboarding_completed ?? true;

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

  const showAdminSeoLinks = await isAdmin();

  return (
    <Suspense fallback={<div className="min-h-screen bg-page animate-pulse" />}>
      <DashboardClient
        userEmail={user.email ?? ""}
        favorites={favorites}
        history={history}
        projects={projects}
        usageToday={usageToday}
        plan={plan}
        onboardingCompleted={onboardingCompleted}
        showRevenueNav={isOperatorUser(user)}
        showAdminSeoLinks={showAdminSeoLinks}
      />
    </Suspense>
  );
}
