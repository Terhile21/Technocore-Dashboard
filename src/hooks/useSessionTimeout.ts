"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useSessionTimeout(timeoutMinutes: number): void {
  const lockIdentity = useAppStore((state) => state.lockIdentity);
  useEffect(() => {
    const timeout = Math.max(1, timeoutMinutes) * 60_000;
    let timer: number | undefined;
    const reset = () => { if (timer) window.clearTimeout(timer); timer = window.setTimeout(lockIdentity, timeout); };
    const onVisibility = () => { if (document.hidden) lockIdentity(); else reset(); };
    reset();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", reset);
    window.addEventListener("keydown", reset);
    return () => { if (timer) window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pointerdown", reset); window.removeEventListener("keydown", reset); };
  }, [lockIdentity, timeoutMinutes]);
}
