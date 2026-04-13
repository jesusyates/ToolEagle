import { existsSync, mkdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { test, expect } from "@playwright/test";
import { getServiceSupabaseFromEnv } from "./helpers/e2e-supabase-admin";
import { fetchGoogleIdTokenFromRefreshToken } from "./helpers/google-refresh-id-token";

type AuthSnap = {
  status: string;
  token: string;
  tokenLength: number;
  gateStatus: number | null;
  identity: string;
  error: string;
};

type Seed = { email: string; password: string };

const SEED_PATH = resolve(process.cwd(), "e2e", ".auth-seed.json");
const ARTIFACTS = resolve(process.cwd(), "e2e", ".artifacts");

function readSeed(): Seed {
  if (!existsSync(SEED_PATH)) {
    throw new Error("Missing e2e/.auth-seed.json — global setup creates it");
  }
  return JSON.parse(readFileSync(SEED_PATH, "utf8")) as Seed;
}

function snapToAuthDebugLines(s: AuthSnap): string {
  return [
    `status: ${s.status}`,
    `token: ${s.token}`,
    `token length: ${s.tokenLength}`,
    `gateStatus: ${s.gateStatus === null ? "none" : String(s.gateStatus)}`,
    `identity: ${s.identity}`,
    `error: ${s.error}`
  ].join("\n");
}

async function probeWindowAuthSnapshot(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(() => {
    const w = window as Window & { __TE_AUTH_SNAPSHOT__?: AuthSnap };
    return JSON.stringify(w.__TE_AUTH_SNAPSHOT__ ?? null);
  });
}

function ensureArtifactsDir(): void {
  if (!existsSync(ARTIFACTS)) mkdirSync(ARTIFACTS, { recursive: true });
}

function googleCredsFromEnvOrFile(): { email: string; password: string } | null {
  const email = process.env.E2E_GOOGLE_EMAIL?.trim();
  const password = process.env.E2E_GOOGLE_PASSWORD?.trim();
  if (email && password) return { email, password };
  const p = resolve(process.cwd(), "e2e", ".google-creds.json");
  if (!existsSync(p)) return null;
  try {
    const j = JSON.parse(readFileSync(p, "utf8")) as { email?: string; password?: string };
    if (typeof j.email === "string" && typeof j.password === "string" && j.email && j.password) {
      return { email: j.email, password: j.password };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readGoogleRefreshFromEnvOrFile(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} | null {
  const clientId =
    process.env.E2E_GOOGLE_OAUTH_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret =
    process.env.E2E_GOOGLE_OAUTH_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.E2E_GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  if (clientId && clientSecret && refreshToken) {
    return { clientId, clientSecret, refreshToken };
  }
  const p = resolve(process.cwd(), "e2e", ".google-oauth-refresh.json");
  if (!existsSync(p)) return null;
  try {
    const j = JSON.parse(readFileSync(p, "utf8")) as {
      client_id?: string;
      client_secret?: string;
      refresh_token?: string;
    };
    if (
      typeof j.client_id === "string" &&
      typeof j.client_secret === "string" &&
      typeof j.refresh_token === "string" &&
      j.client_id &&
      j.client_secret &&
      j.refresh_token
    ) {
      return {
        clientId: j.client_id,
        clientSecret: j.client_secret,
        refreshToken: j.refresh_token
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function waitVerified(page: import("@playwright/test").Page, timeout = 120_000): Promise<AuthSnap> {
  try {
    await page.waitForFunction(
      () => {
        const w = window as Window & { __TE_AUTH_SNAPSHOT__?: AuthSnap };
        return w.__TE_AUTH_SNAPSHOT__?.status === "verified";
      },
      undefined,
      { timeout }
    );
  } catch {
    const snap = await page.evaluate(() => {
      const w = window as Window & { __TE_AUTH_SNAPSHOT__?: AuthSnap };
      return w.__TE_AUTH_SNAPSHOT__ ?? null;
    });
    throw new Error(`waitVerified timeout. __TE_AUTH_SNAPSHOT__=${JSON.stringify(snap)}`);
  }
  return await page.evaluate(() => {
    const w = window as Window & { __TE_AUTH_SNAPSHOT__?: AuthSnap };
    return w.__TE_AUTH_SNAPSHOT__ as AuthSnap;
  });
}

async function snapshotFallback(page: import("@playwright/test").Page): Promise<AuthSnap> {
  return await page.evaluate(() => {
    const w = window as Window & { __TE_AUTH_SNAPSHOT__?: AuthSnap };
    if (!w.__TE_AUTH_SNAPSHOT__) throw new Error("no __TE_AUTH_SNAPSHOT__");
    return w.__TE_AUTH_SNAPSHOT__;
  });
}

async function clearBrowserAuth(page: import("@playwright/test").Page, baseURL: string): Promise<void> {
  await page.context().clearCookies();
  await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

async function assertHeaderAccountVisible(page: import("@playwright/test").Page): Promise<void> {
  await expect(page.locator('button[aria-haspopup="true"]').first()).toBeVisible({ timeout: 60_000 });
}

/** Best-effort Google account chooser + email/password (UI varies by locale / account state). */
async function completeGoogleLoginUi(
  page: import("@playwright/test").Page,
  email: string,
  password: string
): Promise<void> {
  const emailField = page.locator('input[type="email"],#identifierId').first();
  await emailField.waitFor({ state: "visible", timeout: 60_000 });
  await emailField.fill(email);
  await page.getByRole("button", { name: /Next|Continue|下一步/i }).first().click();

  const pwField = page.locator('input[type="password"][name="Passwd"],input[type="password"]').first();
  await pwField.waitFor({ state: "visible", timeout: 60_000 });
  await pwField.fill(password);
  await page.getByRole("button", { name: /Next|Continue|下一步|Sign in|登录/i }).first().click();

  const cont = page.getByRole("button", { name: /Continue|Allow|允许|继续/i });
  if (await cont.first().isVisible({ timeout: 8_000 }).catch(() => false)) {
    await cont.first().click().catch(() => {});
  }
}

let captured = {
  google: "",
  password: "",
  signup: "",
  refresh: "",
  logout: ""
};
let googlePassed = false;

test.describe.configure({ mode: "serial" });

test("auth flows (Google, password, signup verify, refresh, logout)", async ({ page, baseURL }) => {
  test.setTimeout(360_000);
  const origin = baseURL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  const seed = readSeed();
  ensureArtifactsDir();

  await test.step("Google login", async () => {
    try {
      const creds = googleCredsFromEnvOrFile();
      const refreshCfg = readGoogleRefreshFromEnvOrFile();

      await clearBrowserAuth(page, origin);
      await page.goto(`${origin}/login?next=/dashboard`, { waitUntil: "load" });
      await page.getByRole("button", { name: /Continue with Google/i }).click({ force: true });

      if (refreshCfg) {
        const idToken = await fetchGoogleIdTokenFromRefreshToken(refreshCfg);
        await page.waitForURL(/accounts\.google\.com|supabase\.co\/auth\/v1\/authorize/i, {
          timeout: 60_000
        });
        await page.goto(`${origin}/login?next=/dashboard`, { waitUntil: "load" });
        await page.waitForFunction(
          () =>
            typeof (window as Window & { __TE_E2E_SIGNIN_GOOGLE_ID_TOKEN__?: unknown })
              .__TE_E2E_SIGNIN_GOOGLE_ID_TOKEN__ === "function",
          undefined,
          { timeout: 60_000 }
        );
        await page.evaluate(async (t) => {
          const fn = (window as Window & { __TE_E2E_SIGNIN_GOOGLE_ID_TOKEN__?: (x: string) => Promise<void> })
            .__TE_E2E_SIGNIN_GOOGLE_ID_TOKEN__;
          if (!fn) throw new Error("missing __TE_E2E_SIGNIN_GOOGLE_ID_TOKEN__");
          await fn(t);
        }, idToken);
      } else if (creds) {
        await page.waitForURL(/accounts\.google\.com|supabase\.co\/auth\//, { timeout: 60_000 });
        const u = page.url();
        if (u.includes("accounts.google.com")) {
          await completeGoogleLoginUi(page, creds.email, creds.password);
        }
        await page.waitForURL(/\/auth\/callback/, { timeout: 120_000 });
      } else {
        throw new Error(
          "no google creds: add e2e/.google-creds.json or e2e/.google-oauth-refresh.json (or env equivalents)"
        );
      }

      await waitVerified(page);
      const snap = await snapshotFallback(page);
      captured.google = snapToAuthDebugLines(snap);

      expect(snap.status).toBe("verified");
      expect(snap.token).toBe("yes");
      expect(snap.gateStatus).toBe(200);
      expect(snap.identity).toBe("yes");
      expect(snap.error).toBe("none");

      await assertHeaderAccountVisible(page);
      const vis = await probeWindowAuthSnapshot(page);
      await page.screenshot({ path: resolve(ARTIFACTS, "google-login.png"), fullPage: true });
      captured.google += `\nheader_probe: ${vis.slice(0, 400)}`;

      await page.locator('button[aria-haspopup="true"]').first().click({ force: true });
      await page.getByRole("button", { name: /log out/i }).click({ force: true });
      await page.waitForFunction(
        () => (window as Window & { __TE_AUTH_SNAPSHOT__?: AuthSnap }).__TE_AUTH_SNAPSHOT__?.status === "guest",
        undefined,
        { timeout: 60_000 }
      );
      googlePassed = true;
    } catch (e) {
      captured.google = `FAIL\n${e instanceof Error ? e.message : String(e)}`;
      googlePassed = false;
      await page.screenshot({ path: resolve(ARTIFACTS, "google-login-fail.png"), fullPage: true }).catch(() => {});
    }
  });

  await test.step("Password login", async () => {
    await clearBrowserAuth(page, origin);
    await page.goto(`${origin}/login?next=/dashboard`, { waitUntil: "load" });
    await page.getByLabel(/email/i).waitFor({ state: "visible", timeout: 60_000 });
    await page.locator("#pw-email").fill(seed.email);
    await page.locator("#pw-password").fill(seed.password);
    await page.getByRole("button", { name: /^Sign in$/i }).click({ force: true });

    const snap = await waitVerified(page);
    captured.password = snapToAuthDebugLines(snap);

    expect(snap.status).toBe("verified");
    expect(snap.token).toBe("yes");
    expect(snap.gateStatus).toBe(200);
    expect(snap.identity).toBe("yes");
    expect(snap.error).toBe("none");

    await assertHeaderAccountVisible(page);
    const vis = await probeWindowAuthSnapshot(page);
    await page.screenshot({ path: resolve(ARTIFACTS, "password-login.png"), fullPage: true });
    captured.password += `\nvisible_state: ${vis}`;

    await page.locator('button[aria-haspopup="true"]').first().click({ force: true });
    await page.getByRole("button", { name: /log out/i }).click({ force: true });
    await page.waitForFunction(
      () => (window as Window & { __TE_AUTH_SNAPSHOT__?: AuthSnap }).__TE_AUTH_SNAPSHOT__?.status === "guest",
      undefined,
      { timeout: 60_000 }
    );
  });

  await test.step("Signup verify + verified session", async () => {
    const admin = getServiceSupabaseFromEnv();
    const uniq = `auth-e2e-signup-${Date.now()}@example.com`;
    const signupPassword = "E2E_Signup_Verify_2099_Club!";

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "signup",
      email: uniq,
      password: signupPassword,
      options: { redirectTo: `${origin.replace(/\/$/, "")}/` }
    });
    if (linkErr || !linkData?.properties?.email_otp) throw linkErr ?? new Error("generateLink missing email_otp");

    const otp = String(linkData.properties.email_otp ?? "").replace(/\D/g, "");
    if (otp.length < 6) throw new Error("invalid email_otp from generateLink");

    await clearBrowserAuth(page, origin);

    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(
      ([em, pw]) => {
        sessionStorage.setItem("te_auth_signup_pending_v1", JSON.stringify({ email: em, password: pw }));
      },
      [uniq, signupPassword] as const
    );

    await page.goto(`${origin}/signup/verify`, { waitUntil: "load" });
    await page.locator("#sv-code").fill(otp);
    await page.getByRole("button", { name: /complete sign up/i }).click({ force: true });

    await page.waitForURL(/\/admin\/publish/, { timeout: 120_000 }).catch(() => {});
    const snap = await waitVerified(page);
    captured.signup = snapToAuthDebugLines(snap);

    expect(snap.status).toBe("verified");
    expect(snap.token).toBe("yes");
    expect(snap.gateStatus).toBe(200);
    expect(snap.identity).toBe("yes");
    expect(snap.error).toBe("none");

    await assertHeaderAccountVisible(page);
    await page.screenshot({ path: resolve(ARTIFACTS, "signup-verify.png"), fullPage: true });
  });

  await test.step("Refresh persistence", async () => {
    await page.goto(`${origin}/guides`, { waitUntil: "load" });
    await page.reload({ waitUntil: "load" });
    const snap = await waitVerified(page, 120_000);
    captured.refresh = snapToAuthDebugLines(snap);

    expect(snap.status).toBe("verified");
    expect(snap.token).toBe("yes");
    expect(snap.gateStatus).toBe(200);
    expect(snap.identity).toBe("yes");
    expect(snap.error).toBe("none");

    await assertHeaderAccountVisible(page);
    const vis = await probeWindowAuthSnapshot(page);
    await page.screenshot({ path: resolve(ARTIFACTS, "refresh-persistence.png"), fullPage: true });
    captured.refresh += `\nvisible_state: ${vis}`;
  });

  await test.step("Logout", async () => {
    await page.locator('button[aria-haspopup="true"]').first().click({ force: true });
    await page.getByRole("button", { name: /log out/i }).click({ force: true });
    await page.waitForFunction(
      () => (window as Window & { __TE_AUTH_SNAPSHOT__?: AuthSnap }).__TE_AUTH_SNAPSHOT__?.status === "guest",
      undefined,
      { timeout: 60_000 }
    );
    const snap = await snapshotFallback(page);
    captured.logout = snapToAuthDebugLines(snap);

    expect(snap.status).toBe("guest");
    expect(snap.token).toBe("no");
    expect(snap.identity).toBe("no");

    await expect(
      page.getByRole("link", { name: /\blogin\b|log in|sign in|登录/i }).first()
    ).toBeVisible({
      timeout: 30_000
    });
    await page.screenshot({ path: resolve(ARTIFACTS, "logout.png"), fullPage: true });
  });

  test.info().attach("captured-auth-debug", {
    body: JSON.stringify(captured, null, 2),
    contentType: "application/json"
  });

  console.log("\n--- E2E AUTH SNAPSHOT CAPTURE ---\n");
  console.log(captured.google);
  console.log("\n---\n");
  console.log(captured.password);
  console.log("\n---\n");
  console.log(captured.signup);
  console.log("\n---\n");
  console.log(captured.refresh);
  console.log("\n---\n");
  console.log(captured.logout);

  expect(googlePassed, captured.google).toBe(true);
});
