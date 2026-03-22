import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { GscClient } from "./GscClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SEO Index Monitoring | ToolEagle Admin",
  robots: { index: false, follow: false }
};

export default async function AdminSeoPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/admin/seo"));
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-2xl">
            <Link href="/dashboard" className="text-sm font-medium text-sky-600 hover:underline">
              ← Dashboard
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">SEO Index Monitoring</h1>
            <p className="mt-2 text-slate-600">
              Indexed pages, top queries, clicks and impressions from Google Search Console.
            </p>

            <GscClient />

            <div className="mt-6">
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-sky-600 hover:underline"
              >
                Open Google Search Console →
              </a>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
