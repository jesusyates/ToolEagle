"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFavorites, getHistory } from "@/lib/storage";

const SYNC_KEY = "tooleagle_synced_user";

export function useSyncOnLogin() {
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;

    async function sync() {
      try {
        const supabase = createClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!user) return;

        const lastSynced = typeof window !== "undefined" ? localStorage.getItem(SYNC_KEY) : null;
        if (lastSynced === user.id) return;

        const favorites = getFavorites();
        const history = getHistory();

        if (favorites.length === 0 && history.length === 0) {
          if (typeof window !== "undefined") {
            localStorage.setItem(SYNC_KEY, user.id);
          }
          return;
        }

        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            favorites: favorites.map((f) => ({
              toolSlug: f.toolSlug,
              toolName: f.toolName,
              text: f.text,
              savedAt: f.savedAt
            })),
            history: history.map((h) => ({
              toolSlug: h.toolSlug,
              toolName: h.toolName,
              input: h.input,
              items: h.items,
              timestamp: h.timestamp
            }))
          })
        });

        if (res.ok && typeof window !== "undefined") {
          localStorage.setItem(SYNC_KEY, user.id);
        }
        synced.current = true;
      } catch {
        // Supabase not configured or sync failed - ignore
      }
    }

    sync();
  }, []);
}
