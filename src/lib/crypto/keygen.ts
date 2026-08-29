import { getPublicKeyAsync, utils } from "@noble/ed25519";

const DID_PREFIX = new Uint8Array([0xed, 0x01]);
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  let encoded = "";
  while (value > 0n) {
    encoded = BASE58_ALPHABET[Number(value % 58n)] + encoded;
    value /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    encoded = `1${encoded}`;
  }
  return encoded || "1";
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function computeFingerprint(did: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(did));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export function generateNonce(): string {
  const time = Date.now();
  const random = crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000;
  const nonce = `${time}${String(random).padStart(6, "0")}`;
  return nonce.slice(0, 19);
}

export async function generateKeypair() {
  const privateKey = utils.randomSecretKey();
  const publicKey = await getPublicKeyAsync(privateKey);
  const did = didFromPublicKey(publicKey);
  return { privateKey, publicKey, did, fingerprint: await computeFingerprint(did) };
}

export function didFromPublicKey(publicKey: Uint8Array): string {
  if (publicKey.length !== 32) throw new Error("Invalid Ed25519 public key.");
  return `did:key:z${base58Encode(new Uint8Array([...DID_PREFIX, ...publicKey]))}`;
}

export async function didFromPrivateKey(privateKey: Uint8Array): Promise<string> {
  if (privateKey.length !== 32) throw new Error("Invalid Ed25519 private key.");
  return didFromPublicKey(await getPublicKeyAsync(privateKey));
}
