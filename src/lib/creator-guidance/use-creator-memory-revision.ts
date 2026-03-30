"use client";

import { useEffect, useState } from "react";

/** Bumps when V187 memory changes (same-tab or storage). */
export function useCreatorMemoryRevision(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("te_v187_memory_updated", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("te_v187_memory_updated", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);
  return tick;
}
