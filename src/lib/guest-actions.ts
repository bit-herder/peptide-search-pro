"use client";

import { GUEST_ACTION_LIMIT } from "./guest-limits";

export type GuestActionType = "search" | "outbound_click" | "tool_use";

interface GuestAction {
  type: GuestActionType;
  key: string;
}

const STORAGE_KEY = "psp_guest_action_log";

function loadActions(): GuestAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveActions(actions: GuestAction[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  } catch {
    // ignore quota errors
  }
}

export function getGuestActionCount(): number {
  return loadActions().length;
}

export function guestActionsRemaining(): number {
  return Math.max(0, GUEST_ACTION_LIMIT - getGuestActionCount());
}

export function isGuestActionLimitReached(): boolean {
  return getGuestActionCount() >= GUEST_ACTION_LIMIT;
}

/** Record an action. Returns new total count. */
export function recordGuestAction(type: GuestActionType, key: string): number {
  const actions = loadActions();

  if (type === "outbound_click") {
    actions.push({ type, key: `${key}:${Date.now()}` });
  } else {
    const normalized = key.trim().toLowerCase();
    const exists = actions.some((a) => a.type === type && a.key === normalized);
    if (!exists) {
      actions.push({ type, key: normalized });
    }
  }

  saveActions(actions);
  return actions.length;
}

export function clearGuestActions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
