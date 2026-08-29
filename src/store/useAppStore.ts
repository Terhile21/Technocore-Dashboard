"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decryptPrivateKey } from "@/lib/crypto/encryption";
import { computeFingerprint, didFromPrivateKey } from "@/lib/crypto/keygen";
import type { Contribution, DIDIdentity, SignedActivity } from "@/lib/types";

type AppState = {
  identities: DIDIdentity[];
  activeDid: string | null;
  activities: SignedActivity[];
  contributions: Contribution[];
  addActivity: (activity: SignedActivity) => void;
  replaceActivities: (activities: SignedActivity[]) => void;
  addContribution: (contribution: Contribution) => void;
  setPrimaryContribution: (id: string) => void;
  archiveContribution: (id: string) => void;
  deleteContribution: (id: string) => void;
  messageDraft: { room: string; text: string; templateId?: string };
  contributionDraft: { publicUrl: string; description: string; source: NonNullable<Contribution["source"]> };
  updateDraft: (draft: Partial<AppState["messageDraft"]> & Partial<AppState["contributionDraft"]>) => void;
  setActiveDid: (did: string | null) => void;
  addIdentity: (identity: DIDIdentity, privateKey: Uint8Array) => void;
  importIdentity: (identity: DIDIdentity, privateKey: Uint8Array) => void;
  unlockIdentity: (did: string, passphrase: string) => Promise<void>;
  lockIdentity: () => void;
  deleteIdentity: (id: string) => void;
  renameIdentity: (id: string, label: string) => void;
  unlockedPrivateKey: Uint8Array | null;
  sessionTimeoutMinutes: number;
  defaultRoom: string;
  setSessionTimeoutMinutes: (minutes: number) => void;
  setDefaultRoom: (room: string) => void;
};

export const useAppStore = create<AppState>()(persist((set, get) => ({
  identities: [],
  activeDid: null,
  activities: [],
  contributions: [],
  messageDraft: { room: "lobby", text: "" },
  contributionDraft: { publicUrl: "", description: "", source: "other" },
  addActivity: (activity) => set((state) => ({ activities: [activity, ...state.activities.filter((item) => item.id !== activity.id)] })),
  replaceActivities: (activities) => set({ activities }),
  addContribution: (contribution) => set((state) => { const existing = state.contributions.filter((item) => item.id !== contribution.id); const sameDid = existing.filter((item) => item.did === contribution.did); const shouldBePrimary = contribution.isPrimary || sameDid.length === 0; return { contributions: [...existing.map((item) => shouldBePrimary && item.did === contribution.did ? { ...item, isPrimary: false } : item), { ...contribution, isPrimary: shouldBePrimary }] }; }),
  setPrimaryContribution: (id) => set((state) => { const selected = state.contributions.find((item) => item.id === id); return { contributions: state.contributions.map((item) => ({ ...item, isPrimary: item.did === selected?.did && item.id === id })) }; }),
  archiveContribution: (id) => set((state) => ({ contributions: state.contributions.map((item) => item.id === id ? { ...item, isArchived: !item.isArchived } : item) })),
  deleteContribution: (id) => set((state) => ({ contributions: state.contributions.filter((item) => item.id !== id) })),
  updateDraft: (draft) => set((state) => ({ messageDraft: { ...state.messageDraft, ...draft }, contributionDraft: { ...state.contributionDraft, ...draft } })),
  setActiveDid: (activeDid) => set((state) => ({ activeDid, unlockedPrivateKey: activeDid === state.activeDid ? state.unlockedPrivateKey : null })),
  unlockedPrivateKey: null,
  sessionTimeoutMinutes: 10,
  defaultRoom: "lobby",
  setSessionTimeoutMinutes: (sessionTimeoutMinutes) => set({ sessionTimeoutMinutes }),
  setDefaultRoom: (defaultRoom) => set({ defaultRoom }),
  addIdentity: (identity, privateKey) => set((state) => ({ identities: [...state.identities, identity], activeDid: identity.did, unlockedPrivateKey: privateKey })),
  importIdentity: (identity, privateKey) => set((state) => ({ identities: [...state.identities.filter((item) => item.did !== identity.did), identity], activeDid: identity.did, unlockedPrivateKey: privateKey })),
  unlockIdentity: async (did, passphrase) => {
    const identity = get().identities.find((item) => item.did === did);
    if (!identity) throw new Error("Identity not found.");
    const privateKey = await decryptPrivateKey(identity.encryptedPrivateKey, passphrase);
    const derivedDid = await didFromPrivateKey(privateKey);
    const derived = await computeFingerprint(derivedDid);
    if (derivedDid !== identity.did || derived !== identity.fingerprint) throw new Error("Identity verification failed.");
    set({ activeDid: did, unlockedPrivateKey: privateKey });
  },
  lockIdentity: () => set({ unlockedPrivateKey: null }),
  deleteIdentity: (id) => set((state) => { const identities = state.identities.filter((item) => item.id !== id); const deleted = state.identities.find((item) => item.id === id); return { identities, activeDid: deleted?.did === state.activeDid ? (identities[0]?.did ?? null) : state.activeDid, unlockedPrivateKey: deleted?.did === state.activeDid ? null : state.unlockedPrivateKey }; }),
  renameIdentity: (id, label) => set((state) => ({ identities: state.identities.map((item) => item.id === id ? { ...item, label: label.trim() || "Unnamed identity" } : item) })),
}), { name: "technocore-identity-vault", partialize: (state) => ({ identities: state.identities, activeDid: state.activeDid, activities: state.activities, contributions: state.contributions }) }));
