import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const SEED_EMAIL = "auth-e2e-seed@example.com";
const SEED_PASSWORD = process.env.E2E_SEED_PASSWORD ?? "E2E_Seed_ToolEagle_1999!";

export default async function globalSetup(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "playwright.global-setup: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local"
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
    email_confirm: true
  });

  if (createErr) {
    const msg = createErr.message ?? "";
    if (!/already|registered|exists/i.test(msg)) throw createErr;
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    if (listErr) throw listErr;
    const existing = list.users.find((u) => u.email === SEED_EMAIL);
    if (!existing) throw new Error("seed user exists but not found in listUsers");
    const { error: upErr } = await admin.auth.admin.updateUserById(existing.id, {
      password: SEED_PASSWORD,
      email_confirm: true
    });
    if (upErr) throw upErr;
  } else if (!created.user) {
    throw new Error("createUser returned no user");
  }

  const dir = resolve(process.cwd(), "e2e");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(
    resolve(dir, ".auth-seed.json"),
    JSON.stringify({ email: SEED_EMAIL, password: SEED_PASSWORD }, null, 2),
    "utf8"
  );
}
