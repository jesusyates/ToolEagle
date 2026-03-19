"use client";

import { useEffect } from "react";

const AUTH_CHANNEL = "tooleagle-auth";
const AUTH_STORAGE_KEY = "tooleagle-auth-event";

export function AuthSuccessBroadcast() {
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.postMessage("success");
      channel.close();
    } catch {
      // BroadcastChannel not supported
    }
  }, []);
  return null;
}

export function broadcastAuthFailed() {
  try {
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage("failed");
    channel.close();
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, `failed-${Date.now()}`);
  } catch {
    // ignore
  }
}

export function useAuthBroadcast(onSuccess: () => void, onFailed?: () => void) {
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === "success") onSuccess();
      if (e.data === "failed" && onFailed) onFailed();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY && e.newValue?.startsWith("failed")) {
        onFailed?.();
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    };

    try {
      const channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.addEventListener("message", handleMessage);
      window.addEventListener("storage", handleStorage);

      return () => {
        channel.removeEventListener("message", handleMessage);
        channel.close();
        window.removeEventListener("storage", handleStorage);
      };
    } catch {
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, [onSuccess, onFailed]);
}
