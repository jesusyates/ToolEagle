"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { DelegatedButton } from "@/components/DelegatedButton";

const PLATFORMS = ["TikTok", "YouTube", "Instagram"] as const;
const NICHES = [
  "Fitness",
  "Beauty",
  "Food",
  "Travel",
  "Tech",
  "Education",
  "Lifestyle",
  "Gaming",
  "Business",
  "Fashion",
  "Other"
] as const;

function OnboardingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gateSession = searchParams?.get("gate") === "session";
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(true);
  const [platform, setPlatform] = useState<string>("");
  const [niche, setNiche] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (gateSession) {
      setChecking(false);
      return;
    }
    if (!isLoggedIn) router.replace("/login?next=/onboarding");
    setChecking(false);
  }, [router, authLoading, isLoggedIn, gateSession]);

  if (checking) {
    return (
      <main className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </main>
    );
  }

  if (gateSession) {
    return (
      <main className="min-h-screen bg-page text-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Account verification required</h1>
          <p className="mt-3 max-w-md text-sm text-slate-600">
            We couldn&apos;t verify your account with our service yet. If you were invited or expect access, contact
            support or try signing in with a method that&apos;s already linked to your account.
          </p>
          <Link
            href="/login?gate=session"
            className="mt-6 text-sm font-medium text-sky-700 underline hover:text-sky-800"
          >
            Back to sign in
          </Link>
        </div>
        <SiteFooter />
      </main>
    );
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          onboarding_completed: true,
          onboarding_platform: platform || null,
          onboarding_niche: niche || null
        })
      });
      if (res.ok) {
        const toolSlug = platform === "TikTok" ? "tiktok-caption-generator" : platform === "YouTube" ? "title-generator" : "instagram-caption-generator";
        router.push(`/tools/${toolSlug}?niche=${encodeURIComponent(niche || "content")}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <h1 className="text-2xl font-semibold text-slate-900 text-center">
            Welcome to ToolEagle
          </h1>
          <p className="mt-2 text-sm text-slate-600 text-center">
            Let&apos;s get you set up in 3 quick steps.
          </p>

          <div className="mt-8 space-y-8">
            {step === 1 && (
              <div>
                <h2 className="text-lg font-medium text-slate-900">1. Choose your main platform</h2>
                <div className="mt-4 flex flex-col gap-2">
                  {PLATFORMS.map((p) => (
                    <DelegatedButton
                      key={p}
                      onClick={() => {
                        setPlatform(p);
                        setStep(2);
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-left font-medium transition ${
                        platform === p
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </DelegatedButton>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-lg font-medium text-slate-900">2. Choose your niche</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {NICHES.map((n) => (
                    <DelegatedButton
                      key={n}
                      onClick={() => setNiche(niche === n ? "" : n)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        niche === n
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {n}
                    </DelegatedButton>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <DelegatedButton
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                  >
                    Back
                  </DelegatedButton>
                  <DelegatedButton
                    onClick={() => setStep(3)}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Next
                  </DelegatedButton>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-lg font-medium text-slate-900">3. Generate your first content</h2>
                <p className="mt-2 text-sm text-slate-600">
                  We&apos;ll take you to our {platform || "TikTok"} tool. Enter a topic and generate your first caption or title.
                </p>
                <div className="mt-6 flex gap-3">
                  <DelegatedButton
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                  >
                    Back
                  </DelegatedButton>
                  <DelegatedButton
                    onClick={handleComplete}
                    disabled={saving}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "..." : "Generate now →"}
                  </DelegatedButton>
                </div>
              </div>
            )}
          </div>

          <p className="mt-8 text-center">
            <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
              Skip for now
            </Link>
          </p>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-page flex items-center justify-center">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </main>
      }
    >
      <OnboardingPageInner />
    </Suspense>
  );
}
