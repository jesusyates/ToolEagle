import { createClient } from "@supabase/supabase-js";

export type SupabaseAuthEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

/**
 * Whether an auth user with this email already exists (Supabase Auth / GoTrue).
 * Canonical with project auth store; uses service role listUsers pagination.
 */
export async function authUserExistsInSupabase(
  normEmail: string,
  env: SupabaseAuthEnv
): Promise<boolean> {
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const needle = normEmail.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (data.users.some((u) => (u.email ?? "").toLowerCase() === needle)) return true;
    if (data.users.length < perPage) return false;
    page += 1;
  }
}

/** Convenience for Node hosts that read `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. */
export async function authUserExistsInSupabaseFromProcessEnv(normEmail: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return authUserExistsInSupabase(normEmail, { supabaseUrl, serviceRoleKey });
}
