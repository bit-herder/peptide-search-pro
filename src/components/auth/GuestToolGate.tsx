"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";

interface GuestToolGateProps {
  toolSlug: string;
  children: React.ReactNode;
  className?: string;
}

/** Records first calculator interaction as a guest action. */
export function GuestToolGate({ toolSlug, children, className }: GuestToolGateProps) {
  const { recordAction, isGuestLocked, isAuthenticated } = useAuth();
  const recorded = useRef(false);

  function handleInteraction() {
    if (isAuthenticated || recorded.current || isGuestLocked) return;
    recorded.current = true;
    recordAction("tool_use", toolSlug);
  }

  return (
    <div
      className={cn(className)}
      onInputCapture={handleInteraction}
      onChangeCapture={handleInteraction}
    >
      {children}
    </div>
  );
}
