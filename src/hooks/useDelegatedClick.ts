"use client";

import { useId, useEffect, useCallback } from "react";
import { initClickDelegation, registerClickHandler, unregisterClickHandler } from "@/lib/clickDelegation";

/**
 * Use delegated click for elements that must work when browser translation modifies the DOM.
 * Returns props to spread onto a button/link. Do NOT pass onClick to the element.
 */
export function useDelegatedClick(handler: (e: React.MouseEvent<Element>) => void | Promise<void>) {
  const id = useId();

  useEffect(() => {
    initClickDelegation();
  }, []);

  const delegatedHandler = useCallback(
    (e: MouseEvent) => {
      const fn = handler as (e: unknown) => void | Promise<void>;
      const result = fn(e as unknown as React.MouseEvent);
      if (result instanceof Promise) {
        result.catch((e) => {
          console.error("[useDelegatedClick] async handler rejected:", e);
        });
      }
    },
    [handler]
  );

  useEffect(() => {
    registerClickHandler(id, delegatedHandler);
    return () => unregisterClickHandler(id);
  }, [id, delegatedHandler]);

  return {
    "data-delegate-click": "",
    "data-delegate-id": id
  };
}
