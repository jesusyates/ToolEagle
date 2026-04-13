/**
 * Fetches a fresh Google OIDC ID token using a long-lived refresh token.
 * Requires OAuth client with scopes that include `openid` (and typically `email`, `profile`).
 */
export async function fetchGoogleIdTokenFromRefreshToken(opts: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const body = new URLSearchParams({
    client_id: opts.clientId.trim(),
    client_secret: opts.clientSecret.trim(),
    refresh_token: opts.refreshToken.trim(),
    grant_type: "refresh_token"
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const j = (await res.json()) as { id_token?: string; error?: string; error_description?: string };
  if (!j.id_token) {
    throw new Error(
      `Google refresh did not return id_token (${res.status}): ${j.error ?? "unknown"} ${j.error_description ?? ""}`.trim()
    );
  }
  return j.id_token;
}
