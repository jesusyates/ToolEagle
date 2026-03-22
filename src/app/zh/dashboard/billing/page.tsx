import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildLoginRedirect } from "@/lib/auth/login-redirect";
import { BillingClient } from "@/app/dashboard/billing/BillingClient";

export const dynamic = "force-dynamic";

export default async function ZhDashboardBillingPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirect("/zh/dashboard/billing"));
  }

  return <BillingClient variant="zh" />;
}
