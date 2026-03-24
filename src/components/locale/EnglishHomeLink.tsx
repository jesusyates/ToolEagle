"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { TranslateAwareLink } from "@/components/TranslateAwareLink";

type Props = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  children: ReactNode;
};

/**
 * 从中文站进英文首页：必须走 `/?te_locale=en` 由 middleware Set-Cookie。
 * 使用普通 `<a href>` 全页导航，勿用 preventDefault + 客户端路由（避免与 cookie 竞态）。
 */
export function EnglishHomeLink({ children, ...rest }: Props) {
  return (
    <TranslateAwareLink href="/?te_locale=en" {...rest}>
      {children}
    </TranslateAwareLink>
  );
}
