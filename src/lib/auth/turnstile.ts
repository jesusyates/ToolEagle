/**
 * Cloudflare Turnstile server verification.
 * Set TURNSTILE_SECRET_KEY; optional NEXT_PUBLIC_TURNSTILE_SITE_KEY for widgets.
 */

export async function verifyTurnstileToken(token: string | undefined, remoteip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    // Dev / missing config: do not block (still rate-limited)
    return true;
  }
  if (!token || typeof token !== "string" || token.length < 10) {
    return false;
  }
  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteip && remoteip !== "unknown") body.set("remoteip", remoteip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export function turnstileRequired(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim() && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}
