"use client";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useAppStore } from "@/store/useAppStore";
export function SessionGuard({ children }: { children: ReactNode }) {
  const minutes = useAppStore((state) => state.sessionTimeoutMinutes);
  const lock = useAppStore((state) => state.lockIdentity);

  useSessionTimeout(minutes);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "l" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName)) {
        lock();
      }
    };

    const onLeave = () => {
      lock();
    };

    const onVisibility = () => {
      if (document.hidden) {
        lock();
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [lock]);

  return children;
}