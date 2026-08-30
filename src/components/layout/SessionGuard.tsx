"use client";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useAppStore } from "@/store/useAppStore";
export function SessionGuard({ children }: { children: ReactNode }) {
  const minutes = useAppStore((state) => state.sessionTimeoutMinutes);
  const lock = useAppStore((state) => state.lockIdentity);

  useSessionTimeout(minutes);

  // Manual lock ("l" key) and the idle timeout above are the only auto-lock
  // triggers. Tab-switch (visibilitychange) and navigation (beforeunload/
  // pagehide) locks were intentionally removed: they locked the signing key
  // on ordinary alt-tabbing, which read as random "logged out" failures
  // rather than the deliberate browser-local security behavior it is.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key?.toLowerCase() === "l" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement | null)?.tagName ?? "")) {
        lock();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [lock]);

  return children;
}
