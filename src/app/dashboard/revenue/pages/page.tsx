import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { isOperatorUser } from "@/lib/auth/operator";
import { RevenuePagesView } from "./RevenuePagesView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Revenue by Page | ToolEagle",
  description: "Page-level affiliate performance: top pages, keywords, and tools"
};

export default async function RevenuePagesDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/dashboard/revenue/pages"));
  }
  if (!isOperatorUser(user)) {
    redirect("/dashboard");
  }

  return <RevenuePagesView locale="en" />;
}
