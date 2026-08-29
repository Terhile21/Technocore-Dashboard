import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

export type NextStep = { title: string; description: string; label: string; href?: string; onClick?: () => void };
export function NextStepBanner({ step, locked }: { step: NextStep; locked: boolean }) {
  return <section className="flex flex-col justify-between gap-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-6 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Next step</p><h2 className="mt-2 text-xl font-semibold text-zinc-100">{step.title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">{step.description}</p></div>{step.href ? <Link href={step.href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-300">{locked && <LockKeyhole size={15} />}{step.label}<ArrowRight size={16} /></Link> : <button onClick={step.onClick} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-300">{step.label}<ArrowRight size={16} /></button>}</section>;
}
