import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPostClient } from "./NewPostClient";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/new-post");
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <NewPostClient userEmail={user.email ?? ""} />
    </main>
  );
}
