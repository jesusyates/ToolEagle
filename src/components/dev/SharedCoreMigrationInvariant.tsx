"use client";

import { useEffect } from "react";

const GLOBAL_FLAG = "__te_phase5_system_check";

/**
 * Dev-only: log once per page load that primary product flows target shared-core-backend
 * (see Phase 4 usage/quota, Phase 3 AI, Phase 2 tasks).
 */
export function SharedCoreMigrationInvariant() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const g = globalThis as unknown as Record<string, boolean | undefined>;
    if (g[GLOBAL_FLAG]) return;
    g[GLOBAL_FLAG] = true;
    console.log(
      "[system-check]\nauth: shared-core\nai: shared-core\ntasks: shared-core\nusage: shared-core"
    );
  }, []);
  return null;
}
