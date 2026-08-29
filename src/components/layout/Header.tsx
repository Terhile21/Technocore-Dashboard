"use client";

import { LockKeyhole } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function Header() {
  const activeDid = useAppStore((state) => state.activeDid);
  const identities = useAppStore((state) => state.identities);
  const setActiveDid = useAppStore((state) => state.setActiveDid);
  const unlocked = !!useAppStore((state) => state.unlockedPrivateKey);
  return <header className="flex min-h-20 items-center justify-between border-b border-zinc-800/80 px-5 py-4 sm:px-8"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.18em] text-zinc-600">Workspace</p>{identities.length > 1 ? <select aria-label="Active identity" value={activeDid ?? ""} onChange={(event) => setActiveDid(event.target.value || null)} className="mt-1 max-w-[18rem] truncate bg-transparent font-mono text-xs text-zinc-400 outline-none sm:max-w-md">{identities.map((identity) => <option key={identity.did} value={identity.did} className="bg-zinc-900">{identity.label} · {identity.did}</option>)}</select> : <p className="mt-1 max-w-[18rem] truncate font-mono text-xs text-zinc-400 sm:max-w-md">{activeDid ?? "No DID selected"}</p>}</div><div className="flex items-center gap-2 text-xs text-zinc-500"><LockKeyhole size={14} className={unlocked ? "text-emerald-400" : "text-zinc-600"} />{unlocked ? "Identity unlocked" : "Vault locked"}</div></header>;
}
