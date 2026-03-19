import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";
import { DistributionGenerateClient } from "./DistributionGenerateClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Generate Distribution Content | ToolEagle",
  description: "AI-generated Reddit, X, Quora content for distribution"
};

export default async function DistributionGeneratePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/distribution/generate");
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                href="/dashboard/distribution"
                className="text-sm font-medium text-sky-600 hover:text-sky-800"
              >
                ← 分发仪表盘
              </Link>
              <h1 className="text-2xl font-semibold text-slate-900 mt-2">
                📝 生成分发内容
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                输入关键词，自动生成 Reddit、X、Quora 内容
              </p>
            </div>
          </div>

          <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-xl bg-slate-100" />}>
            <DistributionGenerateClient />
          </Suspense>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
