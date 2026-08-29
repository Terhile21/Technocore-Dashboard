import { base64UrlToBytes, bytesToBase64Url } from "@/lib/crypto/keygen";

export type EncryptedIdentity = {
  version: 1;
  algorithm: "AES-GCM";
  keyDerivation: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

const ITERATIONS = 310_000;

async function deriveKey(passphrase: string, salt: Uint8Array) {
  if (!passphrase) throw new Error("A passphrase is required.");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: ITERATIONS, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function encryptPrivateKey(privateKey: Uint8Array, passphrase: string): Promise<string> {
  if (!passphrase) throw new Error("A passphrase is required.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, privateKey as unknown as BufferSource);
  return JSON.stringify({ version: 1, algorithm: "AES-GCM", keyDerivation: "PBKDF2-SHA-256", iterations: ITERATIONS, salt: bytesToBase64Url(salt), iv: bytesToBase64Url(iv), ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)) } satisfies EncryptedIdentity);
}

export async function decryptPrivateKey(encrypted: string, passphrase: string): Promise<Uint8Array> {
  let envelope: EncryptedIdentity;
  try {
    envelope = JSON.parse(encrypted) as EncryptedIdentity;
  } catch {
    throw new Error("Invalid encrypted identity data.");
  }
  if (envelope.version !== 1 || envelope.algorithm !== "AES-GCM" || envelope.keyDerivation !== "PBKDF2-SHA-256" || envelope.iterations !== ITERATIONS) throw new Error("Unsupported identity file.");
  if (!envelope.salt || !envelope.iv || !envelope.ciphertext) throw new Error("Invalid encrypted identity data.");
  const key = await deriveKey(passphrase, base64UrlToBytes(envelope.salt));
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64UrlToBytes(envelope.iv) as unknown as BufferSource }, key, base64UrlToBytes(envelope.ciphertext) as unknown as BufferSource);
    const privateKey = new Uint8Array(plaintext);
    if (privateKey.length !== 32) throw new Error("Invalid private key.");
    return privateKey;
  } catch {
    throw new Error("Incorrect passphrase or damaged identity file.");
  }
}
