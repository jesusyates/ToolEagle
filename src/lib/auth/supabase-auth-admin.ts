/**
 * Web shim: signup/API routes use process env; explicit-env variant for other hosts (App, workers).
 */
export type { SupabaseAuthEnv } from "@tooleagle/auth-system";
export {
  authUserExistsInSupabase as authUserExistsInSupabaseWithEnv,
  authUserExistsInSupabaseFromProcessEnv
} from "@tooleagle/auth-system";

import { authUserExistsInSupabaseFromProcessEnv } from "@tooleagle/auth-system";

export async function authUserExistsInSupabase(normEmail: string): Promise<boolean> {
  return authUserExistsInSupabaseFromProcessEnv(normEmail);
}
