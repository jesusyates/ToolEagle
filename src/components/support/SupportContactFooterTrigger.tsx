"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { SupportContactModal } from "@/components/support/SupportContactModal";

/** 中文站页脚「人工帮助」— 与反馈弹窗同级的独立入口 */
export function SupportContactFooterTrigger() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-slate-400 hover:text-red-800 hover:underline text-xs"
      >
        人工帮助
      </button>
      <SupportContactModal open={open} onClose={() => setOpen(false)} sourcePage={pathname} />
    </>
  );
}
