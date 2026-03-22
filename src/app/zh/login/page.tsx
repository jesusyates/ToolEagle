"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/auth/LoginForm";
import { ZH } from "@/lib/zh-site/paths";

function ZhLoginLoadingFallback() {
  const t = useTranslations("loginPage");
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{t("title")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("loadingFallback")}</p>
        </div>
      </div>
    </main>
  );
}

export default function ZhLoginPage() {
  return (
    <Suspense fallback={<ZhLoginLoadingFallback />}>
      <main className="min-h-screen bg-page text-slate-900 flex flex-col">
        <LoginForm defaultNext="/zh" termsHref={ZH.terms} />
      </main>
    </Suspense>
  );
}
