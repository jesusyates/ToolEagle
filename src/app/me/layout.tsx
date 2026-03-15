import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export default async function MeLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "/me";
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return <>{children}</>;
}
