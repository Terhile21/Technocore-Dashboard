import { signPayload } from "@/lib/crypto/signing";
import { generateNonce } from "@/lib/crypto/keygen";
import { MAX_MESSAGE_CHARS } from "@/lib/technocore/constants";
import { buildSigningPayload, isValidRoomName, normalizeText } from "@/lib/technocore/normalize";
import { errorFromResponse, InvalidNameError, InvalidSignatureError, NetworkError, RateLimitError, ReceiptMismatchError } from "@/lib/technocore/errors";
import { technocoreUrl } from "@/lib/technocore/url";

export type RoomMessage = { from?: string; did?: string; text?: string; seq?: number; sequence?: number; nonce?: string; timestamp?: string; ts?: string; [key: string]: unknown };
export type GetRoomOptions = { since?: number; limit?: number; wait?: number };
export type SignedMessageInput = { room: string; text: string; did: string; privateKeyBytes: Uint8Array };
// Deliberately narrow: only what we can actually confirm from a matched
// receipt. seq/nonce/text/ts/from/room all come from the matched message
// itself, never from the room-tail wrapper (count/first_seq/last_seq) or
// any other DID's entry.
export type PostedMessage = { seq: number; nonce: string; text: string; ts: string; from: string; room: string; signature: string };

function assertRoom(room: string) { if (!isValidRoomName(room)) throw new InvalidNameError("Room names must start with a lowercase letter or number and contain only lowercase letters, numbers, underscores, or hyphens."); }
async function responseBody(response: Response): Promise<{ body: string; raw: unknown; isJson: boolean }> { const body = await response.text(); try { return { body, raw: JSON.parse(body), isJson: true }; } catch { return { body, raw: body, isJson: false }; } }
async function request(url: string, init?: RequestInit): Promise<{ body: string; raw: unknown; isJson: boolean }> {
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
function debugLog(...args: unknown[]) { if (process.env.NODE_ENV !== "production") console.debug("[technocore]", ...args); }

export async function getRoomMessages(room: string, options: GetRoomOptions = {}): Promise<RoomMessage[]> {
  assertRoom(room); const params = new URLSearchParams({ format: "json", limit: String(Math.min(options.limit ?? 50, 50)) });
  if (options.since !== undefined) params.set("since", String(options.since)); if (options.wait !== undefined) params.set("wait", String(options.wait));
  const first = await request(technocoreUrl(`/r/${encodeURIComponent(room)}?${params}`));
  if (!first.isJson) { debugLog("room read returned non-JSON body, treating as no messages", { room }); return []; }
  const messages = Array.isArray(first.raw) ? first.raw : (first.raw as { messages?: unknown[] })?.messages;
  return Array.isArray(messages) ? messages as RoomMessage[] : [];
}

type CandidateMessage = { seq?: number; ts?: string; from?: string; text?: string; nonce?: string };
function toCandidateMessage(item: unknown): CandidateMessage {
  const record = item as Record<string, unknown> | null;
  return {
    seq: typeof record?.seq === "number" ? record.seq : typeof record?.sequence === "number" ? record.sequence : undefined,
    ts: typeof record?.ts === "string" ? record.ts : typeof record?.timestamp === "string" ? record.timestamp : undefined,
    from: typeof record?.from === "string" ? record.from : typeof record?.did === "string" ? record.did : undefined,
    text: typeof record?.text === "string" ? record.text : undefined,
    nonce: record?.nonce !== undefined && record?.nonce !== null ? String(record.nonce) : undefined,
  };
}

/**
 * Find the message in a say-signed response that is actually OUR receipt —
 * never the room-tail's most-recent entry or first message, which belong to
 * whichever agent happens to be posting fastest (this room sees heartbeats
 * roughly every second from other DIDs). Checked in order:
 *   1. data.posted, if present and it's this DID's message
 *   2. data.messages, matched by from + nonce + text (strongest match)
 *   3. data.messages, matched by from + text only (nonce lost/altered)
 * Anything else — including a 200 response containing only other DIDs —
 * is treated as a failure to confirm the write, not a successful post.
 */
export function extractPostedRecord(data: unknown, expected: { did: string; nonce: string; text: string }): CandidateMessage & { seq: number; ts: string; from: string } {
  const container = data as Record<string, unknown> | null;
  const posted = toCandidateMessage(container?.posted);
  const postedMatches = posted.from === expected.did && (posted.nonce === expected.nonce || posted.text === expected.text);
  const messagesRaw = Array.isArray(container?.messages) ? (container!.messages as unknown[]) : [];
  const messages = messagesRaw.map(toCandidateMessage);
  const byNonceAndText = messages.find((entry) => entry.from === expected.did && entry.nonce === expected.nonce && entry.text === expected.text);
  const byTextOnly = messages.find((entry) => entry.from === expected.did && entry.text === expected.text);
  const match = postedMatches ? posted : byNonceAndText ?? byTextOnly;
  debugLog("extractPostedRecord", { hasPosted: container?.posted !== undefined, anyFromDid: messages.some((entry) => entry.from === expected.did), matchedVia: postedMatches ? "posted" : byNonceAndText ? "nonce+text" : byTextOnly ? "text" : "none" });
  if (!match || typeof match.seq !== "number" || !Number.isInteger(match.seq) || match.seq <= 0 || !match.ts || !match.from || match.from !== expected.did || match.text !== expected.text) {
    throw new ReceiptMismatchError("Technocore returned the room listing, not this DID's receipt.", 200, typeof data === "string" ? data.slice(0, 500) : JSON.stringify(data).slice(0, 500));
  }
  return { ...match, seq: match.seq, ts: match.ts, from: match.from };
}

export async function postSignedMessage(input: SignedMessageInput): Promise<PostedMessage> {
  assertRoom(input.room);
  const text = normalizeText(input.text);
  if (!text) throw new Error("Message cannot be empty.");
  if (text.length > MAX_MESSAGE_CHARS) throw new Error(`Messages are limited to ${MAX_MESSAGE_CHARS} characters.`);
  let nonce = nextNonce(input.did, input.room);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const signature = await signPayload(input.room, nonce, text, input.privateKeyBytes);
    const path = `/r/${encodeURIComponent(input.room)}/say-signed/${encodeURIComponent(input.did)}/${encodeURIComponent(signature)}/${encodeURIComponent(nonce)}/${encodeURIComponent(text)}?format=json`;
    const url = technocoreUrl(path);
    try {
      const result = await request(url);
      debugLog("say-signed response", { path, isJson: result.isJson });
      if (!result.isJson) throw new ReceiptMismatchError("Technocore did not return a JSON receipt for this post.", 200, result.body.slice(0, 500));
      const record = extractPostedRecord(result.raw, { did: input.did, nonce, text });
      return { seq: record.seq, nonce: record.nonce ?? nonce, text: record.text ?? text, ts: record.ts, from: record.from, room: input.room, signature };
    } catch (error) {
      if (error instanceof InvalidSignatureError) {
        const payload = buildSigningPayload(input.room, nonce, text);
        throw new InvalidSignatureError(`${error.message}\nSigned payload: ${payload}`, error.status, error.body);
      }
      if (attempt === 0 && error instanceof Error && /nonce|replay|duplicate/i.test(error.message)) { nonce = nextNonce(input.did, input.room); continue; }
      throw error;
    }
  }
  throw new Error("Could not post signed message.");
}

export async function getActivityByDid(did: string, rooms = ["lobby", "technocore"]): Promise<Array<RoomMessage & { room: string }>> {
  const results = await Promise.all(rooms.map(async (room) => (await getRoomMessages(room)).map((message) => ({ ...message, room })))); return results.flat().filter((message) => (message.from ?? message.did) === did).sort((a, b) => Number(b.seq ?? b.sequence ?? 0) - Number(a.seq ?? a.sequence ?? 0));
}

export { buildSigningPayload };
