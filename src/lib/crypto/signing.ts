import { signAsync } from "@noble/ed25519";
import { bytesToBase64Url, generateNonce, normalizeText } from "@/lib/crypto/keygen";

export { generateNonce, normalizeText };

export async function signPayload(room: string, nonce: string, text: string, privateKey: Uint8Array): Promise<string> {
  const normalizedRoom = room.toLowerCase().trim();
  const normalizedText = normalizeText(text);
  const payload = `${normalizedRoom}|${nonce}|${normalizedText}`;
  const signature = await signAsync(new TextEncoder().encode(payload), privateKey);
  return bytesToBase64Url(signature);
}
