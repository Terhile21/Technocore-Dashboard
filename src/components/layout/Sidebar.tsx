"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Fingerprint, LayoutDashboard, Settings, Sparkles, ScrollText, Menu, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dids", label: "DIDs", icon: Fingerprint },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/contributions", label: "Contributions", icon: Sparkles },
  { href: "/proof", label: "Proof pack", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <><button onClick={() => setOpen(true)} aria-label="Open navigation" title="Open navigation" className="fixed right-4 top-5 z-10 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-300 md:hidden"><Menu size={20} /></button><div onClick={() => setOpen(false)} className={`fixed inset-0 z-20 bg-black/60 transition ${open ? "block" : "hidden"}`} /><aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-zinc-800 bg-zinc-950 px-5 py-6 transition-transform md:translate-x-0 md:z-0 md:w-64`}>
      <div className="flex items-center justify-between md:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 font-mono text-sm font-bold text-zinc-950">TC</span>
          <span><span className="block text-sm font-semibold text-zinc-100">Technocore</span><span className="block text-xs text-zinc-500">Dashboard</span></span>
        </Link>
        <button onClick={() => setOpen(false)} aria-label="Close navigation" title="Close navigation" className="rounded-lg p-2 text-zinc-500 hover:text-zinc-200 md:hidden"><X size={18} /></button>
        <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400 md:inline-block">Local first</span>
      </div>
      <nav className="mt-5 flex gap-1 overflow-x-auto md:mt-12 md:block md:space-y-1">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}`}><Icon size={17} strokeWidth={active ? 2.3 : 1.8} />{label}</Link>;
        })}
      </nav>
      <div className="mt-auto hidden border-t border-zinc-800 pt-5 md:block"><p className="text-xs leading-5 text-zinc-600">Private keys stay encrypted in your browser.</p></div>
    </aside></>
  );
}
