import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { DistributionClient } from "@/app/dashboard/distribution/DistributionClient";
import { ZH } from "@/lib/zh-site/paths";

export const dynamic = "force-dynamic";

export default async function ZhDistributionDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/zh/dashboard/distribution"));
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link href={ZH.dashboard} className="text-sm font-medium text-red-700 hover:text-red-900">
                ← 返回工作台
              </Link>
              <h1 className="text-2xl font-semibold text-slate-900 mt-2">中文创作入口</h1>
              <p className="mt-1 text-sm text-slate-600 max-w-xl">
                登录后优先从抖音工具开始；其他平台与英文站分发见下方。
              </p>
            </div>
          </div>

          <DistributionClient items={[]} />
        </section>
      </div>

    </main>
  );
}
