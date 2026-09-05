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
  const byOldestFirst = <T extends { timestamp?: string; createdAt?: string }>(items: T[]) => [...items].sort((a, b) => new Date(a.timestamp ?? a.createdAt ?? 0).getTime() - new Date(b.timestamp ?? b.createdAt ?? 0).getTime());
  const intros = ownActivities.filter((item) => item.type === "intro" && item.room === "lobby");
  // Prefer the earliest intro that actually has a confirmed sequence — a
  // stale pre-fix entry with no sequence should never keep winning over a
  // freshly re-recorded one just because it's older.
  const lobbyIntro = byOldestFirst(intros.filter((item) => item.sequence != null))[0] ?? byOldestFirst(intros)[0];
  const confirmedContributions = ownContributions.filter((item) => item.sequence != null);
  const primaryContribution = confirmedContributions.find((item) => item.isPrimary) ?? byOldestFirst(confirmedContributions)[0] ?? ownContributions.find((item) => item.isPrimary) ?? byOldestFirst(ownContributions)[0];
  return { did: activeDid, fingerprint: identity.fingerprint, label: identity.label, generatedAt: new Date().toISOString(), lobbyIntro, primaryContribution, extraContributions: ownContributions.filter((item) => item.id !== primaryContribution?.id), activityCount: ownActivities.length };
}
