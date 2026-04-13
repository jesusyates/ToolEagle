"use client";

import { useEffect, useRef } from "react";

let loadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { turnstile?: unknown }).turnstile) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("turnstile script"));
      document.head.appendChild(s);
    });
  }
  return loadPromise;
}

type TurnstileFieldProps = {
  onToken: (token: string | null) => void;
};

/** Invisible / managed widget; when site key unset, nothing renders (server skips captcha). */
export function TurnstileField({ onToken }: TurnstileFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !ref.current) {
      onToken(null);
      return;
    }

    const el = ref.current;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        const w = (window as unknown as { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove?: (id: string) => void } }).turnstile;
        if (cancelled || !w || !el) return;
        widgetId.current = w.render(el, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          "error-callback": () => onToken(null),
          "expired-callback": () => onToken(null)
        });
      })
      .catch(() => onToken(null));

    return () => {
      cancelled = true;
      const w = (window as unknown as { turnstile?: { remove?: (id: string) => void } }).turnstile;
      if (widgetId.current && w?.remove) w.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [onToken]);

  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return null;
  }

  return <div ref={ref} className="flex min-h-[65px] justify-center py-2" />;
}
