"use client";

import { Suspense } from "react";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { PasswordLoginForm } from "@/components/auth/PasswordLoginForm";

function ZhLoginLoading() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
      <SiteFooter />
    </main>
  );
}

export default function ZhLoginPage() {
  return (
    <Suspense fallback={<ZhLoginLoading />}>
      <main className="min-h-screen bg-page text-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">登录</h1>
            <p className="mt-2 text-sm text-slate-600">使用邮箱密码或 Google 继续</p>
          </div>
          <PasswordLoginForm defaultNext="/zh" />
        </div>
        <SiteFooter />
      </main>
    </Suspense>
  );
}
