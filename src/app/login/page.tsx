"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginLoadingFallback() {
  const t = useTranslations("loginPage");
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("loadingFallback")}</p>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <main className="min-h-screen bg-page text-slate-900 flex flex-col">
        <SiteHeader />
        <LoginForm defaultNext="/dashboard" />
        <SiteFooter />
      </main>
    </Suspense>
  );
}
