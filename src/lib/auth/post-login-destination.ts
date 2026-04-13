/**
 * OAuth forwards this in `next` when the user did not pass an explicit `?next=` —
 * resolved after session exists (client-side).
 */
export const POST_LOGIN_RESOLVE_SENTINEL = "__post_login_resolve__";

export const ADMIN_DEFAULT_POST_LOGIN = "/admin/seo";

/** EN `/login` default when `next` is omitted and the user is not an admin. */
export const NON_ADMIN_DEFAULT_POST_LOGIN = "/dashboard";

function isSafeRelativePath(p: string): boolean {
  return p.startsWith("/") && !p.startsWith("//");
}

/**
 * If `explicitNext` is a safe relative path, return it unchanged.
 * Otherwise: admins → {@link ADMIN_DEFAULT_POST_LOGIN}, else `fallbackForNonAdmin`.
 */
export async function resolvePostLoginPath(
  explicitNext: string | null | undefined,
  fallbackForNonAdmin: string
): Promise<string> {
  if (explicitNext && isSafeRelativePath(explicitNext)) {
    return explicitNext;
  }
  try {
    const res = await fetch("/api/auth/admin-status", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as { admin?: boolean };
    if (j.admin === true) return ADMIN_DEFAULT_POST_LOGIN;
  } catch {
    /* network — fallback */
  }
  return fallbackForNonAdmin;
}
