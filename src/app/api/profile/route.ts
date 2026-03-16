import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase().replace(/\s+/g, "") : undefined;
    const displayName = typeof body.display_name === "string" ? body.display_name.trim().slice(0, 100) : undefined;
    const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 500) : undefined;
    const onboardingCompleted = body.onboarding_completed === true;
    const onboardingPlatform = typeof body.onboarding_platform === "string" ? body.onboarding_platform.slice(0, 50) : undefined;
    const onboardingNiche = typeof body.onboarding_niche === "string" ? body.onboarding_niche.slice(0, 50) : undefined;

    if (username !== undefined) {
      if (username.length < 2) {
        return NextResponse.json({ error: "Username must be at least 2 characters" }, { status: 400 });
      }
      if (!/^[a-z0-9_-]+$/.test(username)) {
        return NextResponse.json({ error: "Username can only contain letters, numbers, underscores, and hyphens" }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (username !== undefined) updates.username = username || null;
    if (displayName !== undefined) updates.display_name = displayName || null;
    if (bio !== undefined) updates.bio = bio || null;
    if (body.onboarding_completed !== undefined) updates.onboarding_completed = onboardingCompleted;
    if (onboardingPlatform !== undefined) updates.onboarding_platform = onboardingPlatform || null;
    if (onboardingNiche !== undefined) updates.onboarding_niche = onboardingNiche || null;

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/profile] API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
