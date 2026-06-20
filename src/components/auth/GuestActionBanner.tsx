"use client";

import { useAuth } from "./AuthProvider";
import { GUEST_ACTION_LIMIT } from "@/lib/guest-limits";

export function GuestActionBanner() {
  const { actionsRemaining, openSignIn } = useAuth();

  return (
    <div className="sticky top-14 z-30 border-b border-accent/20 bg-accent/5 px-4 py-2 text-center text-xs sm:text-sm text-muted">
      <span className="text-foreground font-medium">{actionsRemaining}</span> of{" "}
      {GUEST_ACTION_LIMIT} free actions left · searches, supplier clicks, and tools each count ·{" "}
      <button
        type="button"
        onClick={() => openSignIn("general")}
        className="text-accent hover:underline"
      >
        Sign in free
      </button>{" "}
      for unlimited access
    </div>
  );
}
