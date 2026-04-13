"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy URL: password reset is OTP-only at /reset-password. */
export default function UpdatePasswordRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reset-password");
  }, [router]);
  return (
    <main className="min-h-screen bg-page flex items-center justify-center">
      <p className="text-sm text-slate-500">Redirecting…</p>
    </main>
  );
}
