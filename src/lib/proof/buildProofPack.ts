import type { Contribution, DIDIdentity, SignedActivity } from "@/lib/types";

export type ProofPack = {
  did: string;
  fingerprint: string;
  label?: string;
  generatedAt: string;
  lobbyIntro?: SignedActivity;
  primaryContribution?: Contribution;
  extraContributions: Contribution[];
  activityCount: number;
};

export function buildProofPack(activeDid: string, identities: DIDIdentity[], activities: SignedActivity[], contributions: Contribution[]): ProofPack | null {
  const identity = identities.find((item) => item.did === activeDid);
  if (!identity) return null;
  const ownActivities = activities.filter((item) => item.did === activeDid);
  const ownContributions = contributions.filter((item) => item.did === activeDid && !item.isArchived);
  const lobbyIntro = ownActivities.filter((item) => item.type === "intro" && item.room === "lobby").sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
  const primaryContribution = ownContributions.find((item) => item.isPrimary) ?? [...ownContributions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  return { did: activeDid, fingerprint: identity.fingerprint, label: identity.label, generatedAt: new Date().toISOString(), lobbyIntro, primaryContribution, extraContributions: ownContributions.filter((item) => item.id !== primaryContribution?.id), activityCount: ownActivities.length };
}
