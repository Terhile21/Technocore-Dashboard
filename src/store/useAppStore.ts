"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useSessionTimeout(timeoutMinutes: number): void {
  const lockIdentity = useAppStore((state) => state.lockIdentity);
  useEffect(() => {
    const timeout = Math.max(1, timeoutMinutes) * 60_000;
    let timer: number | undefined;
    const reset = () => { if (timer) window.clearTimeout(timer); timer = window.setTimeout(lockIdentity, timeout); };
    // Tab-switch (visibilitychange) no longer locks immediately — it was
    // locking the signing key on ordinary alt-tabbing. The idle timer keeps
    // running in the background tab and still locks after `timeout` of no
    // pointer/keyboard activity, whether or not the tab is visible.
    reset();
    window.addEventListener("pointerdown", reset);
    window.addEventListener("keydown", reset);
    return () => { if (timer) window.clearTimeout(timer); window.removeEventListener("pointerdown", reset); window.removeEventListener("keydown", reset); };
  }, [lockIdentity, timeoutMinutes]);
}
