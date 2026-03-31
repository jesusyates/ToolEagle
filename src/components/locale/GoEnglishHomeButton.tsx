"use client";

import type { ReactNode } from "react";
import { navigateToEnglishHome } from "@/lib/market/navigate-to-english-home";

type Props = {
  children: ReactNode;
  className?: string;
};

/** 中文站内「进入全球主站首页」等：先写 cookie 再整页进 `/`，与 middleware 对齐 */
export function GoEnglishHomeButton({ children, className }: Props) {
  return (
    <button type="button" onClick={() => navigateToEnglishHome()} className={className}>
      {children}
    </button>
  );
}
