export class TechnocoreError extends Error {
  readonly status?: number;
  readonly body?: string;
  constructor(message: string, status?: number, body?: string) { super(message); this.name = "TechnocoreError"; this.status = status; this.body = body; }
}

export class RateLimitError extends TechnocoreError {
  readonly waitSeconds: number;
  constructor(message: string, waitSeconds: number, status = 429, body?: string) { super(message, status, body); this.name = "RateLimitError"; this.waitSeconds = waitSeconds; }
}
export class InvalidSignatureError extends TechnocoreError { constructor(message: string, status = 403, body?: string) { super(message, status, body); this.name = "InvalidSignatureError"; } }
export class InvalidNameError extends TechnocoreError { constructor(message: string, status = 400, body?: string) { super(message, status, body); this.name = "InvalidNameError"; } }
export class CapacityError extends TechnocoreError { constructor(message: string, status = 400, body?: string) { super(message, status, body); this.name = "CapacityError"; } }
export class NetworkError extends TechnocoreError { constructor(message: string, body?: string) { super(message, undefined, body); this.name = "NetworkError"; } }

export function errorFromResponse(status: number, body: string): TechnocoreError {
  const lower = body.toLowerCase();
  if (status === 429) { const match = lower.match(/(?:wait|retry)[^0-9]*(\\d+)/); return new RateLimitError(body || "Rate limited.", match ? Number(match[1]) : 30, status, body); }
  if (status === 403 || lower.includes("signature")) return new InvalidSignatureError(body || "Invalid signature.", status, body);
  if (lower.includes("capacity") || lower.includes("full")) return new CapacityError(body || "Room capacity reached.", status, body);
  if (lower.includes("name") || lower.includes("room")) return new InvalidNameError(body || "Invalid room name.", status, body);
  return new TechnocoreError(body || `Technocore request failed (${status}).`, status, body);
}
