import { normalizeText } from "@/lib/technocore/normalize";
export type ContributionSource = "x" | "github" | "video" | "article" | "tool" | "other";
export function buildContributionMessage({ url, description, source }: { url: string; description: string; source?: ContributionSource }): string {
  const prefix = source === "tool" ? "I published a Technocore tool" : "I published a Technocore contribution";
  const detail = source === "tool" ? "It helps people manage DIDs and record contributions." : `It helps people understand ${description}.`;
  return normalizeText(`${prefix}: ${url}. ${detail}`);
}
