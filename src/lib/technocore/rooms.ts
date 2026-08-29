import { DEFAULT_ROOMS } from "@/lib/technocore/constants";

export function listKnownRooms(): string[] { return [...DEFAULT_ROOMS]; }
export function getLobby(): string { return "lobby"; }
export function getTechnocoreRoom(): string { return "technocore"; }
