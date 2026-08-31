export type DIDIdentity = {
  id: string;
  did: string;
  fingerprint: string;
  label: string;
  encryptedPrivateKey: string;
  createdAt: string;
  lastUsedAt?: string;
};

export type SignedActivity = {
  id: string;
  did: string;
  room: string;
  sequence?: number;
  nonce: string;
  text: string;
  timestamp: string;
  type: "intro" | "contribution" | "custom";
};

export type Contribution = {
  id: string;
  did: string;
  publicUrl: string;
  description: string;
  sequence?: number;
  room: string;
  nonce: string;
  text: string;
  createdAt: string;
  source?: "x" | "github" | "video" | "article" | "tool" | "other";
  isPrimary?: boolean;
  isArchived?: boolean;
};

export type MessageDraft = { room: string; text: string; templateId?: string };
