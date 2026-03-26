/**
 * V106: Google Indexing API — shared submit helper (URL_UPDATED).
 * Uses GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY (same as /api/indexing).
 */

import { google } from "googleapis";

export async function submitUrlToGoogleIndexing(url: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return { ok: false, error: "Indexing API not configured (GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY)" };
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/indexing"]
    } as ConstructorParameters<typeof google.auth.GoogleAuth>[0]);

    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const accessToken = token.token;
    if (!accessToken) {
      return { ok: false, error: "Failed to get access token" };
    }

    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" })
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: errText || `Indexing API returned ${res.status}` };
    }

    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
