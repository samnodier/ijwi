import type { Authority, ReportCategory } from "../types.js";

// Preferred authority type for each report category, best match first.
const CATEGORY_TO_AUTHORITY_TYPES: Record<ReportCategory, string[]> = {
  flood: ["fire", "municipal", "utilities"],
  accident: ["police", "health", "fire"],
  infrastructure: ["municipal", "utilities"],
  gov_delay: ["municipal"],
  safety: ["police"],
  other: ["municipal"],
};

/** Pick the best-matching authority id for a category, if any. */
export function suggestAuthorityId(
  category: ReportCategory,
  authorities: Authority[],
): string | null {
  if (authorities.length === 0) return null;

  for (const wanted of CATEGORY_TO_AUTHORITY_TYPES[category] ?? []) {
    const match = authorities.find((a) => a.type.toLowerCase() === wanted);
    if (match) return match.id;
  }

  // No type match: fall back to the first available authority.
  return authorities[0].id;
}
