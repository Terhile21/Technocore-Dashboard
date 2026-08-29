import { MAX_MESSAGE_CHARS, NAME_REGEX } from "@/lib/technocore/constants";

export function normalizeText(text: string): string {
  return text.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_CHARS);
}

export function isValidRoomName(name: string): boolean {
  return NAME_REGEX.test(name);
}

export function buildSigningPayload(room: string, nonce: string, text: string): string {
  return `${room}|${nonce}|${normalizeText(text)}`;
}
