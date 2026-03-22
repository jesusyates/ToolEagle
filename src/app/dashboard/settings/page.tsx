import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { ProfileSettingsForm } from "./ProfileSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/dashboard/settings"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16 max-w-xl">
          <Link href="/dashboard" className="text-sm font-medium text-sky-600 hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Creator profile</h1>
          <p className="mt-1 text-slate-600">
            Set a username to get a public profile at /creators/your-username. Your posts and tools used will appear there.
          </p>

          <ProfileSettingsForm
            initialUsername={profile?.username ?? ""}
            initialDisplayName={profile?.display_name ?? ""}
            initialBio={profile?.bio ?? ""}
          />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
