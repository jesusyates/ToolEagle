import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";

export const dynamic = "force-dynamic";

/** 中文站不提供 Reddit/X/Quora 生成页；统一进入「中文增长与 SEO」枢纽 */
export default async function ZhDistributionGenerateRedirect() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/zh/dashboard/distribution"));
  }

  redirect("/zh/dashboard/distribution");
}
