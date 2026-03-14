"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { DelegatedButton } from "@/components/DelegatedButton";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold text-slate-900">{t("somethingWentWrong")}</h2>
      <DelegatedButton
        onClick={reset}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        {t("tryAgain")}
      </DelegatedButton>
    </div>
  );
}
