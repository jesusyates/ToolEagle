import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { IndexingDashboardClient } from "./IndexingDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Indexing Dashboard | ToolEagle Admin",
  robots: { index: false, follow: false }
};

export default async function AdminIndexingPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/indexing");
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-2xl">
            <Link href="/dashboard" className="text-sm font-medium text-sky-600 hover:underline">
              ← Dashboard
            </Link>
            <Link href="/admin/seo" className="ml-4 text-sm font-medium text-sky-600 hover:underline">
              SEO Monitoring
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Indexing Dashboard</h1>
            <p className="mt-2 text-slate-600">
              Total pages, indexed status, and manual URL submission via Google Search Console and Indexing API.
            </p>

            <IndexingDashboardClient />
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
