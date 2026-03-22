import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import Link from "next/link";
import { ProfileSettingsForm } from "@/app/dashboard/settings/ProfileSettingsForm";
import { ZH } from "@/lib/zh-site/paths";

export const dynamic = "force-dynamic";

export default async function ZhDashboardSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/zh/dashboard/settings"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">

      <div className="flex-1">
        <section className="container pt-10 pb-16 max-w-xl">
          <Link href={ZH.dashboard} className="text-sm font-medium text-red-700 hover:underline">
            ← 返回工作台
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">创作者资料</h1>
          <p className="mt-1 text-slate-600">
            设置用户名后，可在 /creators/你的用户名 展示公开主页；你的动态与使用过的工具会显示在该页。
          </p>

          <ProfileSettingsForm
            initialUsername={profile?.username ?? ""}
            initialDisplayName={profile?.display_name ?? ""}
            initialBio={profile?.bio ?? ""}
          />
        </section>
      </div>

    </main>
  );
}
