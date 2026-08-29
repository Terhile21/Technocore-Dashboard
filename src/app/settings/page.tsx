"use client";

import { useState } from "react";
import { AlertTriangle, Download, LockKeyhole, Settings2 } from "lucide-react";
import { downloadTextFile } from "@/lib/proof";
import { useAppStore } from "@/store/useAppStore";

export default function SettingsPage() {
  const identities = useAppStore((state) => state.identities);
  const activeDid = useAppStore((state) => state.activeDid);
  const activities = useAppStore((state) => state.activities);
  const contributions = useAppStore((state) => state.contributions);
  const timeout = useAppStore((state) => state.sessionTimeoutMinutes);
  const defaultRoom = useAppStore((state) => state.defaultRoom);
  const setTimeoutMinutes = useAppStore((state) => state.setSessionTimeoutMinutes);
  const setRoom = useAppStore((state) => state.setDefaultRoom);
  const lock = useAppStore((state) => state.lockIdentity);
  const deleteIdentity = useAppStore((state) => state.deleteIdentity);
  const replaceActivities = useAppStore((state) => state.replaceActivities);
  const [notice, setNotice] = useState("");

  function backup() {
    const data = {
      format: "technocore-public-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      identities: identities.map(({ encryptedPrivateKey: _encrypted, ...publicIdentity }) => publicIdentity),
      activities,
      contributions,
    };
    downloadTextFile("technocore-public-backup.json", JSON.stringify(data, null, 2));
    setNotice("Public records exported.");
  }

  return <div className="space-y-8"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Workspace controls</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Settings</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Control local session behavior and public-record backups.</p></div><section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"><div className="flex items-start gap-4"><Settings2 className="mt-1 text-emerald-400" size={20} /><div className="w-full"><h2 className="font-semibold text-zinc-100">Session and defaults</h2><label className="mt-5 block text-sm text-zinc-300">Lock after inactivity<select value={timeout} onChange={(event) => setTimeoutMinutes(Number(event.target.value))} className="mt-2 block w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm"><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option></select></label><label className="mt-4 block text-sm text-zinc-300">Default room<select value={defaultRoom} onChange={(event) => setRoom(event.target.value)} className="mt-2 block w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm"><option>lobby</option><option>technocore</option></select></label></div></div></section><section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"><h2 className="font-semibold text-zinc-100">Public records backup</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Exports public identities, activity, and contributions. Decrypted keys are never included.</p><button onClick={backup} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300"><Download size={16} />Export public backup</button>{notice && <p className="mt-3 text-sm text-emerald-300">{notice}</p>}</section><section className="rounded-xl border border-red-400/30 bg-red-400/5 p-6"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 text-red-300" size={18} /><div><h2 className="font-semibold text-red-200">Danger zone</h2><p className="mt-2 text-sm text-red-200/70">These actions affect only this browser. Technocore messages cannot be deleted here.</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={lock} className="inline-flex items-center gap-2 rounded-lg border border-red-300/30 px-3 py-2.5 text-sm text-red-200"><LockKeyhole size={16} />Lock now</button><button onClick={() => { if (activeDid && window.confirm("Remove the active DID from this browser?")) deleteIdentity(identities.find((item) => item.did === activeDid)?.id ?? ""); }} className="rounded-lg border border-red-300/30 px-3 py-2.5 text-sm text-red-200">Remove active DID</button><button onClick={() => { if (window.confirm("Clear all local activity?")) replaceActivities([]); }} className="rounded-lg border border-red-300/30 px-3 py-2.5 text-sm text-red-200">Clear activity</button></div></div></div></section></div>;
}
