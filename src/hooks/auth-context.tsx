"use client";

/**
 * Single auth truth: Supabase session → shared-core GET /v1/account/session → context.
 * Nothing else may set verified/guest except this module.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { fetchAccountSessionGate, resetSharedCoreSessionDebugLog } from "@/lib/web/web-auth-client";
import { resolveAuthFromGate, type UiIdentity } from "@tooleagle/auth-system";

const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type AuthUiIdentity = UiIdentity;
export type AuthStatus = "loading" | "guest" | "verified";

export type AuthSlice = {
  status: AuthStatus;
  accessToken: string | null;
  identity: AuthUiIdentity | null;
  gateStatus: number | null;
  /** Human-readable pipeline error (guest only), e.g. gate_identity_missing */
  error: string | null;
  /** Dev aid: JSON top-level keys from last session response */
  debugGateResponseKeys: string;
  debugIdentityKeys: string;
};

export type AuthContextValue = AuthSlice & {
  refreshAuth: () => Promise<AuthStatus>;
  signOutAuth: () => Promise<void>;
  user: AuthUiIdentity | null;
  isLoggedIn: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function emptyDebug(): Pick<AuthSlice, "debugGateResponseKeys" | "debugIdentityKeys"> {
  return { debugGateResponseKeys: "", debugIdentityKeys: "" };
}

function loadingSlice(): AuthSlice {
  return {
    status: "loading",
    accessToken: null,
    identity: null,
    gateStatus: null,
    error: null,
    ...emptyDebug()
  };
}

function guestSlice(partial?: Partial<AuthSlice>): AuthSlice {
  return {
    status: "guest",
    accessToken: null,
    identity: null,
    gateStatus: partial?.gateStatus ?? null,
    error: partial?.error ?? null,
    debugGateResponseKeys: partial?.debugGateResponseKeys ?? "",
    debugIdentityKeys: partial?.debugIdentityKeys ?? ""
  };
}

const AuthProviderInner = ({ children }: { children: ReactNode }) => {
  const [slice, setSlice] = useState<AuthSlice>(loadingSlice);
  const sliceRef = useRef(slice);
  const pipelineSeq = useRef(0);

  useEffect(() => {
    sliceRef.current = slice;
  }, [slice]);

  /** Playwright: `window.__TE_AUTH_SNAPSHOT__` (no raw token in UI). useLayoutEffect so it exists before first paint after reload. */
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & {
      __TE_AUTH_SNAPSHOT__?: {
        status: AuthStatus;
        token: "yes" | "no";
        tokenLength: number;
        gateStatus: number | null;
        identity: "yes" | "no";
        error: string;
      };
    };
    w.__TE_AUTH_SNAPSHOT__ = {
      status: slice.status,
      token: slice.accessToken ? "yes" : "no",
      tokenLength: slice.accessToken?.length ?? 0,
      gateStatus: slice.gateStatus,
      identity:
        slice.identity && (slice.identity.id || slice.identity.email) ? "yes" : "no",
      error: slice.error ?? "none"
    };
  }, [slice]);

  const commitIfLatest = useCallback((seq: number, next: AuthSlice) => {
    if (seq !== pipelineSeq.current) return;
    sliceRef.current = next;
    setSlice(next);
  }, []);

  const resolveFromSession = useCallback(
    async (seq: number, session: Session | null) => {
      if (!hasSupabase) {
        commitIfLatest(seq, guestSlice());
        return;
      }

      const token = session?.access_token?.trim() ?? null;

      if (!token) {
        commitIfLatest(seq, guestSlice());
        return;
      }

      const gate = await fetchAccountSessionGate(token);
      if (seq !== pipelineSeq.current) return;

      const oauthGoogle =
        session?.user?.identities?.some((i) => i.provider === "google") ?? false;
      const r = resolveAuthFromGate(token, gate, { oauthGoogle });
      if (r.status === "verified") {
        commitIfLatest(seq, {
          status: "verified",
          accessToken: r.accessToken,
          identity: r.identity,
          gateStatus: r.gateStatus,
          error: null,
          debugGateResponseKeys: r.debugGateResponseKeys,
          debugIdentityKeys: r.debugIdentityKeys
        });
        return;
      }

      commitIfLatest(
        seq,
        guestSlice({
          gateStatus: r.gateStatus,
          error: r.error,
          debugGateResponseKeys: r.debugGateResponseKeys,
          debugIdentityKeys: r.debugIdentityKeys
        })
      );
    },
    [commitIfLatest]
  );

  const readBrowserSession = useCallback(async (): Promise<Session | null> => {
    if (!hasSupabase) return null;
    const supabase = createClient();
    let {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      await supabase.auth.refreshSession();
      session = (await supabase.auth.getSession()).data.session;
    }
    if (!session?.access_token) {
      await new Promise((r) => setTimeout(r, 300));
      session = (await supabase.auth.getSession()).data.session;
    }
    return session ?? null;
  }, []);

  const refreshAuth = useCallback(async (): Promise<AuthStatus> => {
    const seq = ++pipelineSeq.current;
    commitIfLatest(seq, loadingSlice());

    if (!hasSupabase) {
      commitIfLatest(seq, guestSlice());
      return "guest";
    }

    const session = await readBrowserSession();
    await resolveFromSession(seq, session);
    return sliceRef.current.status;
  }, [commitIfLatest, readBrowserSession, resolveFromSession]);

  const signOutAuth = useCallback(async () => {
    pipelineSeq.current += 1;
    const seq = pipelineSeq.current;
    if (hasSupabase) {
      await createClient().auth.signOut();
    }
    resetSharedCoreSessionDebugLog();
    commitIfLatest(seq, guestSlice());
  }, [commitIfLatest]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !hasSupabase) return;
    const w = window as Window & {
      __TE_E2E_SIGNIN_GOOGLE_ID_TOKEN__?: (token: string) => Promise<void>;
    };
    w.__TE_E2E_SIGNIN_GOOGLE_ID_TOKEN__ = async (idToken: string) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken.trim()
      });
      if (error) throw error;
      const status = await refreshAuth();
      if (status !== "verified") {
        await supabase.auth.signOut();
        await refreshAuth();
      }
    };
    return () => {
      delete w.__TE_E2E_SIGNIN_GOOGLE_ID_TOKEN__;
    };
  }, [hasSupabase, refreshAuth]);

  useEffect(() => {
    if (!hasSupabase) {
      const seq = ++pipelineSeq.current;
      commitIfLatest(seq, guestSlice());
      return;
    }

    const supabase = createClient();

    void (async () => {
      const seq = ++pipelineSeq.current;
      const session = await readBrowserSession();
      await resolveFromSession(seq, session);
    })();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const seq = ++pipelineSeq.current;
      commitIfLatest(seq, loadingSlice());
      void resolveFromSession(seq, session);
    });

    return () => subscription.unsubscribe();
  }, [commitIfLatest, readBrowserSession, resolveFromSession]);

  const value: AuthContextValue = {
    ...slice,
    refreshAuth,
    signOutAuth,
    user: slice.identity,
    isLoggedIn: slice.status === "verified",
    loading: slice.status === "loading"
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
