import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { NewPostClient } from "@/app/dashboard/new-post/NewPostClient";

export const dynamic = "force-dynamic";

export default async function ZhNewPostPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/zh/dashboard/new-post"));
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <NewPostClient userEmail={user.email ?? ""} variant="zh" />
    </main>
  );
}
