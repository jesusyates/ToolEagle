import { createClient } from "@/lib/supabase/server";

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

    return data?.role === "admin";
  } catch {
    return false;
  }
}
