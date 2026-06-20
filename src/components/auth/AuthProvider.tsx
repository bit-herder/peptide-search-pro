"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SignInModal } from "./SignInModal";
import { GuestLockedOverlay } from "./GuestLockedOverlay";
import { GuestActionBanner } from "./GuestActionBanner";
import {
  clearGuestActions,
  getGuestActionCount,
  guestActionsRemaining,
  isGuestActionLimitReached,
  recordGuestAction,
  type GuestActionType,
} from "@/lib/guest-actions";
import { GUEST_ACTION_LIMIT } from "@/lib/guest-limits";

export interface AuthUser {
  id: number;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  actionCount: number;
  actionsRemaining: number;
  isGuestLocked: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  openSignIn: (reason?: SignInReason) => void;
  recordAction: (type: GuestActionType, key: string) => boolean;
}

export type SignInReason = "search" | "alerts" | "limit" | "general";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<SignInReason>("general");
  const [modalDismissable, setModalDismissable] = useState(true);
  const [actionCount, setActionCount] = useState(0);

  const refreshActionCount = useCallback(() => {
    setActionCount(getGuestActionCount());
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
      refreshActionCount();
    }
  }, [refreshActionCount]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const isGuestLocked = !user && !loading && isGuestActionLimitReached();
  const actionsRemaining = user ? GUEST_ACTION_LIMIT : guestActionsRemaining();

  useEffect(() => {
    if (isGuestLocked) {
      setModalReason("limit");
      setModalDismissable(false);
      setModalOpen(true);
    }
  }, [isGuestLocked]);

  const signIn = useCallback(async (email: string) => {
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Sign in failed");
    }
    const data = await res.json();
    setUser(data.user);
    clearGuestActions();
    setActionCount(0);
    setModalOpen(false);
    setModalDismissable(true);
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    refreshActionCount();
  }, [refreshActionCount]);

  const openSignIn = useCallback((reason: SignInReason = "general") => {
    setModalReason(reason);
    setModalDismissable(reason !== "limit");
    setModalOpen(true);
  }, []);

  const recordAction = useCallback(
    (type: GuestActionType, key: string): boolean => {
      if (user) return true;

      if (isGuestActionLimitReached()) {
        openSignIn("limit");
        return false;
      }

      const count = recordGuestAction(type, key);
      setActionCount(count);

      if (count >= GUEST_ACTION_LIMIT) {
        openSignIn("limit");
      }

      return true;
    },
    [user, openSignIn]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      actionCount,
      actionsRemaining,
      isGuestLocked,
      signIn,
      signOut,
      openSignIn,
      recordAction,
    }),
    [
      user,
      loading,
      actionCount,
      actionsRemaining,
      isGuestLocked,
      signIn,
      signOut,
      openSignIn,
      recordAction,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && !user && actionCount > 0 && !isGuestLocked && <GuestActionBanner />}
      <div
        className={
          isGuestLocked
            ? "pointer-events-none select-none opacity-45 grayscale-[0.85] transition-all duration-300"
            : undefined
        }
      >
        {children}
      </div>
      {isGuestLocked && <GuestLockedOverlay />}
      <SignInModal
        open={modalOpen}
        onClose={() => modalDismissable && setModalOpen(false)}
        dismissable={modalDismissable}
        reason={modalReason}
        onSignIn={signIn}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
