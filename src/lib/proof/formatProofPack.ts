import type { ProofPack } from "@/lib/proof/buildProofPack";

function introLines(pack: ProofPack): string[] {
  if (!pack.lobbyIntro) return ["No lobby introduction recorded."];
  const item = pack.lobbyIntro;
  return [`- Room: ${item.room}`, `- Sequence: ${item.sequence}`, `- Nonce: ${item.nonce}`, `- Time: ${item.timestamp}`, `- Text: ${item.text}`];
}
function contributionLines(item: NonNullable<ProofPack["primaryContribution"]>): string[] { return [`- URL: ${item.publicUrl}`, `- Description: ${item.description}`, `- Room: ${item.room}`, `- Sequence: ${item.sequence}`, `- Nonce: ${item.nonce}`, `- Time: ${item.createdAt}`, `- Signed text: ${item.text}`]; }

export function formatShortProof(pack: ProofPack): string {
  return [`Technocore proof`, `DID: ${pack.did}`, `Fingerprint: ${pack.fingerprint}`, `Lobby intro: ${pack.lobbyIntro ? `room ${pack.lobbyIntro.room}, sequence ${pack.lobbyIntro.sequence}` : "not recorded"}`, `Contribution: ${pack.primaryContribution?.publicUrl ?? "not recorded"}`, `Signed record: ${pack.primaryContribution ? `room ${pack.primaryContribution.room}, sequence ${pack.primaryContribution.sequence}` : "not recorded"}`].join("\n");
}
export function formatShareProof(pack: ProofPack): string {
  return [`Recorded a Technocore contribution.`, ``, `DID: ${pack.did}`, `Lobby: ${pack.lobbyIntro ? `room ${pack.lobbyIntro.room}, sequence ${pack.lobbyIntro.sequence}` : "not recorded"}`, `Contribution: ${pack.primaryContribution?.publicUrl ?? "not recorded"}`, `Signed Technocore record: ${pack.primaryContribution ? `room ${pack.primaryContribution.room}, sequence ${pack.primaryContribution.sequence}` : "not recorded"}`].join("\n");
}
export function formatMarkdownProof(pack: ProofPack): string {
  const lines = [`# Technocore Proof Pack`, ``, `- DID: \`${pack.did}\``, `- Fingerprint: \`${pack.fingerprint}\``, `- Identity: ${pack.label ?? "Unnamed identity"}`, `- Generated: ${pack.generatedAt}`, ``, `## Lobby introduction`, ...introLines(pack), ``, `## Primary contribution`];
  if (pack.primaryContribution) lines.push(...contributionLines(pack.primaryContribution)); else lines.push("- No primary contribution recorded.");
  if (pack.extraContributions.length) { lines.push("", "## Extra contributions"); pack.extraContributions.forEach((item) => lines.push(...contributionLines(item), "")); }
  return lines.join("\n");
}
