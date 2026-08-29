import type { DIDIdentity } from "@/lib/types";

export type IdentityFile = { format: "technocore-identity"; version: 1; identity: DIDIdentity };

export function serializeIdentityFile(identity: DIDIdentity): string {
  return JSON.stringify({ format: "technocore-identity", version: 1, identity } satisfies IdentityFile, null, 2);
}

export function parseIdentityFile(value: string): DIDIdentity {
  const parsed = JSON.parse(value) as IdentityFile;
  if (parsed.format !== "technocore-identity" || parsed.version !== 1 || !parsed.identity?.did || !parsed.identity?.encryptedPrivateKey) throw new Error("Invalid Technocore identity file.");
  return parsed.identity;
}
