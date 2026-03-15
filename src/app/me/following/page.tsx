import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { FollowingClient } from "./FollowingClient";
import { UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Following | ToolEagle",
  description: "Creators you follow."
};

export default async function MeFollowingPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-white text-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-1 container pt-10">
          <p className="text-slate-600">Please log in to view your following.</p>
          <Link href="/login?next=/me/following" className="mt-4 inline-block text-sky-600 hover:underline">
            Log in
          </Link>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const { data: follows } = await supabase
    .from("user_follows")
    .select("following_username, created_at")
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <Link href="/me" className="text-sm font-medium text-sky-600 hover:underline">
            ← Me
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <UserPlus className="h-6 w-6 text-sky-500" />
            <h1 className="text-2xl font-semibold text-slate-900">Following</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Creators you follow.
          </p>

          <FollowingClient initialFollows={follows ?? []} />
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
