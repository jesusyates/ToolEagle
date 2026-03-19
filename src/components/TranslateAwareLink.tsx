"use client";

import type { ComponentProps } from "react";

/**
 * Plain <a> for nav links - full page reload avoids React/translation DOM conflict.
 * Client-side navigation causes flash when browser translation is active.
 */
type Props = ComponentProps<"a"> & { href: string };

export function TranslateAwareLink({ href, children, className, ...rest }: Props) {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}
