import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-zinc-950 text-zinc-100"><Sidebar /><div className="md:pl-64"><Header /><main className="mx-auto max-w-7xl p-5 pb-10 sm:p-8">{children}<p className="mt-10 border-t border-zinc-900 pt-4 text-xs text-zinc-600">This tool documents participation. Flop Labs has not published allocation rules.</p></main></div></div>;
}
