import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { isOperatorUser } from "@/lib/auth/operator";
import { RevenuePagesView } from "@/app/dashboard/revenue/pages/RevenuePagesView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "页面收入 | ToolEagle",
  description: "页面级联盟表现：高转化页面、关键词与工具"
};

export default async function ZhRevenuePagesDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/zh/dashboard/revenue/pages"));
  }
  if (!isOperatorUser(user)) {
    redirect("/zh/dashboard");
  }

  return <RevenuePagesView locale="zh" />;
}
