import { normalizeText } from "@/lib/technocore/normalize";
export type ContributionSource = "x" | "github" | "video" | "article" | "tool" | "other";
export function buildContributionMessage({ url, description, source }: { url: string; description: string; source?: ContributionSource }): string {
  const prefix = source === "tool" ? "I published a Technocore tool" : "I published a Technocore contribution";
  return normalizeText(`${prefix}: ${url}. It helps people understand ${description}.`);
}
