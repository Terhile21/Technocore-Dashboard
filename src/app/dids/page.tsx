"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Download, Fingerprint, LockKeyhole, LogOut, Plus, ShieldCheck, Upload, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ux/ConfirmDialog";
import { computeFingerprint, decryptPrivateKey, didFromPrivateKey, encryptPrivateKey, generateKeypair, importEd25519Pem, looksLikePem, parseIdentityFile, serializeIdentityFile } from "@/lib/crypto";
import type { DIDIdentity } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

type Flow = "create" | "import" | null;

export default function DIDsPage() {
  const identities = useAppStore((state) => state.identities);
  const activeDid = useAppStore((state) => state.activeDid);
  const unlockedPrivateKey = useAppStore((state) => state.unlockedPrivateKey);
  const addIdentity = useAppStore((state) => state.addIdentity);
  const importIdentity = useAppStore((state) => state.importIdentity);
  const setActiveDid = useAppStore((state) => state.setActiveDid);
  const renameIdentity = useAppStore((state) => state.renameIdentity);
  const deleteIdentity = useAppStore((state) => state.deleteIdentity);
  const lockIdentity = useAppStore((state) => state.lockIdentity);
  const unlockIdentity = useAppStore((state) => state.unlockIdentity);
  const [flow, setFlow] = useState<Flow>(null);
  const [label, setLabel] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fileText, setFileText] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<DIDIdentity | null>(null);
  const [unlockingDid, setUnlockingDid] = useState<string | null>(null);
  const [unlockPassphrase, setUnlockPassphrase] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [renameTarget, setRenameTarget] = useState<DIDIdentity | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DIDIdentity | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function resetFlow() { setFlow(null); setLabel(""); setPassphrase(""); setConfirmation(""); setFileText(""); setError(""); }
  function resetUnlockForm() { setUnlockingDid(null); setUnlockPassphrase(""); setUnlockError(""); }

  async function unlockSelectedDid() {
    if (!unlockingDid) return;
    setUnlockError("");
    if (!unlockPassphrase.trim()) { setUnlockError("Enter the DID passphrase."); return; }
    try {
      await unlockIdentity(unlockingDid, unlockPassphrase);
      resetUnlockForm();
    } catch (caught) {
      setUnlockError(caught instanceof Error ? caught.message : "Could not unlock identity.");
    }
  }

  async function createDid() {
    setError("");
    if (!passphrase || passphrase !== confirmation) { setError("Enter the same non-empty passphrase twice."); return; }
    try {
      const keypair = await generateKeypair();
      const identity = { id: crypto.randomUUID(), did: keypair.did, fingerprint: keypair.fingerprint, label: label.trim() || "Unnamed identity", encryptedPrivateKey: await encryptPrivateKey(keypair.privateKey, passphrase), createdAt: new Date().toISOString() };
      addIdentity(identity, keypair.privateKey); setCreated(identity); resetFlow();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create identity."); }
  }

  async function importDid() {
    setError("");
    if (!fileText.trim() || !passphrase) { setError("Choose an identity file and enter its passphrase."); return; }
    try {
      const importedPem = looksLikePem(fileText); const parsedIdentity = importedPem ? null : parseIdentityFile(fileText); const privateKey = importedPem ? await importEd25519Pem(fileText, passphrase) : await decryptPrivateKey(parsedIdentity!.encryptedPrivateKey, passphrase);
      const did = await didFromPrivateKey(privateKey); const identity = parsedIdentity ?? { id: crypto.randomUUID(), did, fingerprint: await computeFingerprint(did), label: label.trim() || "Imported identity", encryptedPrivateKey: await encryptPrivateKey(privateKey, passphrase), createdAt: new Date().toISOString() };
      if (await didFromPrivateKey(privateKey) !== identity.did || await computeFingerprint(identity.did) !== identity.fingerprint) throw new Error("Identity verification failed.");
      importIdentity(identity, privateKey); setCreated(identity); resetFlow();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not import identity."); }
  }

  function downloadIdentity(identity: DIDIdentity) {
    const blob = new Blob([serializeIdentityFile(identity)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${identity.label.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "technocore-identity"}.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  function selectFile(file: File | undefined) { if (!file) return; const reader = new FileReader(); reader.onload = () => setFileText(String(reader.result ?? "")); reader.readAsText(file); }

  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Identity manager</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">DIDs</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Create and protect the identities you use across Technocore.</p></div><div className="flex gap-2"><button onClick={() => { setFlow("import"); setError(""); }} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-200 hover:border-zinc-500"><Upload size={16} />Import</button><button onClick={() => { setFlow("create"); setError(""); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-300"><Plus size={16} />Generate New DID</button></div></div>
    {created && <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={19} /><div><p className="text-sm font-semibold text-zinc-100">Identity ready</p><p className="mt-1 break-all font-mono text-xs text-emerald-300">{created.did}</p><p className="mt-2 text-xs text-zinc-500">Fingerprint: {created.fingerprint}</p></div></div><button aria-label="Dismiss" title="Dismiss" onClick={() => setCreated(null)} className="text-zinc-500 hover:text-zinc-200"><X size={17} /></button></div>}
    <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200"><AlertTriangle className="mt-0.5 shrink-0" size={17} /><p><strong className="font-semibold">No recovery:</strong> losing your passphrase means losing access to that identity. Never share your passphrase or private identity file.</p></div>
    {identities.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center"><Fingerprint className="mx-auto text-zinc-600" size={28} /><p className="mt-4 text-sm font-medium text-zinc-200">No identities yet</p><p className="mt-2 text-sm text-zinc-500">Generate or import an encrypted identity to begin.</p></div> : <div className="space-y-3">{identities.map((identity) => <IdentityRow key={identity.id} identity={identity} active={identity.did === activeDid} unlocked={identity.did === activeDid && !!unlockedPrivateKey} onActivate={() => setActiveDid(identity.did)} onUnlock={() => { setUnlockingDid(identity.did); setUnlockPassphrase(""); setUnlockError(""); }} onRename={() => { setRenameTarget(identity); setRenameValue(identity.label); }} onExport={() => downloadIdentity(identity)} onDelete={() => setDeleteTarget(identity)} />)}</div>}
    {unlockedPrivateKey && <button onClick={lockIdentity} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200"><LogOut size={15} />Lock current identity</button>}
    {flow && <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-semibold text-zinc-100">{flow === "create" ? "Generate New DID" : "Import Identity"}</h2><p className="mt-2 text-sm text-zinc-500">{flow === "create" ? "Your private key will be encrypted before storage." : "Import only a file you trust."}</p></div><button aria-label="Close" title="Close" onClick={resetFlow} className="text-zinc-500 hover:text-zinc-200"><X size={18} /></button></div>{flow === "create" && <label className="mt-6 block text-sm text-zinc-300">Label <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Personal" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" /></label>}{flow === "import" && <div className="mt-6"><input ref={fileInput} type="file" accept=".json,.pem,.txt" onChange={(event) => selectFile(event.target.files?.[0])} className="hidden" /><button onClick={() => fileInput.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 px-4 py-6 text-sm text-zinc-300 hover:border-emerald-400"><Upload size={17} />{fileText ? "Identity file selected" : "Choose encrypted identity file"}</button><textarea value={fileText} onChange={(event) => setFileText(event.target.value)} placeholder="Or paste encrypted identity JSON" rows={3} className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 font-mono text-xs outline-none focus:border-emerald-400" /></div>}<label className="mt-4 block text-sm text-zinc-300">Passphrase <input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" /></label>{flow === "create" && <label className="mt-4 block text-sm text-zinc-300">Confirm passphrase <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" /></label>}{error && <p className="mt-4 text-sm text-red-300">{error}</p>}<p className="mt-5 flex gap-2 text-xs leading-5 text-zinc-500"><LockKeyhole className="mt-0.5 shrink-0" size={14} />Private keys stay in memory only while unlocked. Browser storage contains encrypted data.</p><button onClick={flow === "create" ? createDid : importDid} className="mt-6 w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-300">{flow === "create" ? "Create encrypted identity" : "Import and unlock"}</button></div></div>}
  </div>;
}

function IdentityRow({ identity, active, unlocked, onActivate, onUnlock, onRename, onExport, onDelete }: { identity: DIDIdentity; active: boolean; unlocked: boolean; onActivate: () => void; onUnlock: () => void; onRename: () => void; onExport: () => void; onDelete: () => void }) {
  return <div className={`rounded-xl border p-5 ${active ? "border-emerald-400/40 bg-emerald-400/5" : "border-zinc-800 bg-zinc-900/30"}`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex items-center gap-2"><Fingerprint size={17} className="shrink-0 text-emerald-400" /><h2 className="truncate font-medium text-zinc-100">{identity.label}</h2>{active && <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Active</span>}</div><p className="mt-3 truncate font-mono text-xs text-zinc-400">{identity.did}</p><p className="mt-2 text-xs text-zinc-600">Fingerprint {identity.fingerprint} · Created {new Date(identity.createdAt).toLocaleDateString()}</p></div><div className="flex shrink-0 flex-wrap items-center gap-2 text-xs"><span className={unlocked ? "text-emerald-400" : "text-zinc-600"}>{unlocked ? "Unlocked" : "Locked"}</span>{!unlocked && <button onClick={onUnlock} className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-zinc-300 hover:border-zinc-500">Unlock</button>}{!active && <button onClick={onActivate} className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-zinc-300 hover:border-zinc-500">Set active</button>}<button onClick={onRename} className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-zinc-300 hover:border-zinc-500">Rename</button><button aria-label="Export identity" title="Export encrypted identity" onClick={onExport} className="rounded-md border border-zinc-700 p-1.5 text-zinc-300 hover:border-zinc-500"><Download size={15} /></button><button onClick={onDelete} className="rounded-md border border-red-400/20 px-2.5 py-1.5 text-red-300 hover:border-red-400/50">Delete</button></div></div></div>;
}
