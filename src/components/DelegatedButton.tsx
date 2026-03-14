"use client";

import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import type { ComponentPropsWithoutRef } from "react";

type DelegatedButtonProps = Omit<ComponentPropsWithoutRef<"button">, "onClick"> & {
  onClick: (e: React.MouseEvent<Element>) => void | Promise<void>;
};

/**
 * Button that uses click delegation - works when browser translation modifies the DOM.
 */
export function DelegatedButton({ onClick, children, ...props }: DelegatedButtonProps) {
  const delegatedProps = useDelegatedClick(onClick);
  return (
    <button type="button" {...props} {...delegatedProps}>
      {children}
    </button>
  );
}
