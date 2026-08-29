import { signPayload } from "@/lib/crypto/signing";
import { generateNonce } from "@/lib/crypto/keygen";
import { MAX_MESSAGE_CHARS } from "@/lib/technocore/constants";
import { buildSigningPayload, isValidRoomName, normalizeText } from "@/lib/technocore/normalize";
import { errorFromResponse, InvalidNameError, NetworkError, RateLimitError } from "@/lib/technocore/errors";
import { technocoreUrl } from "@/lib/technocore/url";

export type RoomMessage = { from?: string; did?: string; text?: string; seq?: number; sequence?: number; nonce?: string; timestamp?: string; [key: string]: unknown };
export type GetRoomOptions = { since?: number; limit?: number; wait?: number; format?: "json" | "text" };
export type SignedMessageInput = { room: string; text: string; did: string; privateKeyBytes: Uint8Array };
export type PostedMessage = { did: string; room: string; text: string; nonce: string; seq?: number; timestamp?: string; raw: unknown };

function assertRoom(room: string) { if (!isValidRoomName(room)) throw new InvalidNameError("Room names must start with a lowercase letter or number and contain only lowercase letters, numbers, underscores, or hyphens."); }
async function responseBody(response: Response): Promise<{ body: string; raw: unknown }> { const body = await response.text(); try { return { body, raw: JSON.parse(body) }; } catch { return { body, raw: body }; } }
async function request(url: string, init?: RequestInit): Promise<{ body: string; raw: unknown }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, init);
      const result = await responseBody(response);
      if (!response.ok) throw errorFromResponse(response.status, result.body);
      return result;
    } catch (error) {
      if (error instanceof RateLimitError || error instanceof InvalidNameError) throw error;
      if (error instanceof TypeError) {
        if (attempt === 0) continue;
        throw new NetworkError(`Could not reach the Technocore proxy at ${url}.`);
      }
      throw error;
    }
  }
  throw new NetworkError(`Could not reach the Technocore proxy at ${url}.`);
}
function nonceKey(did: string, room: string): string { return `technocore-last-nonce:${did}:${room}`; }
function nextNonce(did: string, room: string): string { const key = nonceKey(did, room); const previous = typeof localStorage === "undefined" ? "" : localStorage.getItem(key) || ""; let nonce = generateNonce(); while (nonce === previous) nonce = generateNonce(); if (typeof localStorage !== "undefined") localStorage.setItem(key, nonce); return nonce; }

export async function getRoomMessages(room: string, options: GetRoomOptions = {}): Promise<RoomMessage[]> {
  assertRoom(room); const params = new URLSearchParams({ format: options.format ?? "json", limit: String(Math.min(options.limit ?? 50, 50)) });
  if (options.since !== undefined) params.set("since", String(options.since)); if (options.wait !== undefined) params.set("wait", String(options.wait));
  const first = await request(technocoreUrl(`/r/${encodeURIComponent(room)}?${params}`)); const messages = Array.isArray(first.raw) ? first.raw : (first.raw as { messages?: unknown[] })?.messages;
  return Array.isArray(messages) ? messages as RoomMessage[] : [];
}

export async function postSignedMessage(input: SignedMessageInput): Promise<PostedMessage> {
  assertRoom(input.room); const text = normalizeText(input.text); if (!text) throw new Error("Message cannot be empty."); if (text.length > MAX_MESSAGE_CHARS) throw new Error(`Messages are limited to ${MAX_MESSAGE_CHARS} characters.`);
  let nonce = nextNonce(input.did, input.room);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const signature = await signPayload(input.room, nonce, text, input.privateKeyBytes);
    try { const path = `/r/${encodeURIComponent(input.room)}/say-signed/${encodeURIComponent(input.did)}/${encodeURIComponent(signature)}/${encodeURIComponent(nonce)}/${encodeURIComponent(text)}`; const result = await request(technocoreUrl(path)); const raw = result.raw as Record<string, unknown>; const sequence = raw?.seq ?? raw?.sequence; return { did: input.did, room: input.room, text, nonce, seq: typeof sequence === "number" ? sequence : undefined, timestamp: typeof raw?.timestamp === "string" ? raw.timestamp : undefined, raw: result.raw }; }
    catch (error) { if (attempt === 0 && error instanceof Error && /nonce|replay|duplicate/i.test(error.message)) { nonce = nextNonce(input.did, input.room); continue; } throw error; }
  }
  throw new Error("Could not post signed message.");
}

export async function getActivityByDid(did: string, rooms = ["lobby", "technocore"]): Promise<Array<RoomMessage & { room: string }>> {
  const results = await Promise.all(rooms.map(async (room) => (await getRoomMessages(room)).map((message) => ({ ...message, room })))); return results.flat().filter((message) => (message.from ?? message.did) === did).sort((a, b) => Number(b.seq ?? b.sequence ?? 0) - Number(a.seq ?? a.sequence ?? 0));
}

export { buildSigningPayload };
