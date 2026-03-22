import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { isOperatorUser } from "@/lib/auth/operator";
import { RevenueDashboardView } from "@/app/dashboard/revenue/RevenueDashboardView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "收入 | ToolEagle",
  description: "联盟点击量与预估收益、页面与关键词表现"
};

export default async function ZhRevenueDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/zh/dashboard/revenue"));
  }
  if (!isOperatorUser(user)) {
    redirect("/zh/dashboard");
  }

  return <RevenueDashboardView locale="zh" />;
}
