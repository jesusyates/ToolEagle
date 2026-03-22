import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { isOperatorUser } from "@/lib/auth/operator";
import { RevenueDashboardView } from "./RevenueDashboardView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Revenue Dashboard | ToolEagle",
  description: "Affiliate clicks and estimated revenue"
};

export default async function RevenueDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/dashboard/revenue"));
  }
  if (!isOperatorUser(user)) {
    redirect("/dashboard");
  }

  return <RevenueDashboardView locale="en" />;
}
