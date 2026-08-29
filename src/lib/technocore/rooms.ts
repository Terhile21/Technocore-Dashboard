import { DEFAULT_ROOMS } from "@/lib/technocore/constants";
import { normalizeText } from "@/lib/technocore/normalize";

export function listKnownRooms(): string[] { return [...DEFAULT_ROOMS]; }
export function getLobby(): string { return "lobby"; }
export function getTechnocoreRoom(): string { return "technocore"; }
export function buildContributionMessage(publicUrl: string, description: string): string {
  return normalizeText(`I published a Technocore contribution: ${publicUrl}. It helps people understand ${description}.`);
}
