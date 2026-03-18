"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "tooleagle-cookie-consent";

const COPY = {
  en: {
    message: "We use cookies to improve your experience and analyze traffic. By continuing, you agree to our",
    privacy: "Privacy Policy",
    decline: "Decline",
    accept: "Accept"
  },
  zh: {
    message: "我们使用 Cookie 以改善体验和分析流量。继续使用即表示您同意我们的",
    privacy: "隐私政策",
    decline: "拒绝",
    accept: "接受"
  }
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname() ?? "";
  const isZh = pathname.startsWith("/zh");
  const t = isZh ? COPY.zh : COPY.en;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  const privacyHref = isZh ? "/zh/privacy" : "/privacy";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-900/95 backdrop-blur text-white shadow-lg"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="container max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-slate-200 flex-1">
          {t.message}{" "}
          <Link href={privacyHref} className="text-sky-400 hover:text-sky-300 underline">
            {t.privacy}
          </Link>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={decline}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-800 transition"
          >
            {t.decline}
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-4 py-2 text-sm font-medium btn-accent text-white rounded-lg transition"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
