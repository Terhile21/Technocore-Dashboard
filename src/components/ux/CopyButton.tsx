"use client";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) { const [copied, setCopied] = useState(false); async function copy() { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400); } return <button onClick={() => void copy()} aria-label={label} title={label} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-500">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : label}</button>; }
