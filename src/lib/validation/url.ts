export function validatePublicUrl(value: string): { valid: boolean; error?: string; warning?: string } {
  if (!value.trim()) return { valid: false, error: "A public URL is required." };
  let url: URL;
  try { url = new URL(value.trim()); } catch { return { valid: false, error: "Enter a valid public URL." }; }
  if (!["http:", "https:"].includes(url.protocol)) return { valid: false, error: "URL must use http or https." };
  if (!url.hostname || url.protocol === "file:") return { valid: false, error: "Use a public http(s) URL, not a local address." };
  if (url.hash && url.hash === "#") return { valid: false, error: "The URL fragment cannot be empty." };
  const warning = ["localhost", "127.0.0.1", "::1"].includes(url.hostname) ? "This URL points to a local address and may not be publicly reachable." : /^(test|asdf|contribution)$/i.test(url.hostname.split(".")[0]) ? "This URL looks like a placeholder." : undefined;
  return { valid: true, warning };
}
export function descriptionWarning(value: string): string | undefined { return /^(test|asdf|contribution)$/i.test(value.trim()) || value.trim().length < 12 ? "Add a little more detail so the contribution is useful to others." : undefined; }
