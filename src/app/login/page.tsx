"use client";

import { Suspense } from "react";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { PasswordLoginForm } from "@/components/auth/PasswordLoginForm";

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Use your email or Google to continue.</p>
        </div>
        {children}
      </div>
      <SiteFooter />
    </main>
  );
}

function LoginLoading() {
  return (
    <LoginShell>
      <p className="text-sm text-slate-500">Loading…</p>
    </LoginShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginShell>
        <PasswordLoginForm />
      </LoginShell>
    </Suspense>
  );
}
