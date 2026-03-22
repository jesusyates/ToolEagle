"use client";

import Link from "next/link";
import { useState } from "react";
import { SupportContactModal } from "@/components/support/SupportContactModal";
import { ZH } from "@/lib/zh-site/paths";

/** 定价页底部：支持页链接 + 弹窗人工帮助（与页脚一致） */
export function ZhPricingSupportNote() {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <p className="max-w-4xl mx-auto mt-10 text-center text-xs text-slate-500">
        自愿支持见{" "}
        <Link href={ZH.support} className="text-slate-600 underline hover:text-red-800">
          支持页面
        </Link>
        ；问题见{" "}
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="text-slate-600 underline hover:text-red-800"
        >
          人工支持
        </button>
        。
      </p>
      <SupportContactModal open={supportOpen} onClose={() => setSupportOpen(false)} sourcePage="/zh/pricing" />
    </>
  );
}
