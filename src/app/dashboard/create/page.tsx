import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { CreatePostClient } from "./CreatePostClient";

export const dynamic = "force-dynamic";

export default async function DashboardCreatePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/dashboard/create"));
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <CreatePostClient />
      </div>
      <SiteFooter />
    </main>
  );
}
