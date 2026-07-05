from app.models.schemas import Authority, ReportCategory

# Preferred authority type for each report category, best match first.
CATEGORY_TO_AUTHORITY_TYPES: dict[ReportCategory, list[str]] = {
    ReportCategory.flood: ["fire", "municipal", "utilities"],
    ReportCategory.accident: ["police", "health", "fire"],
    ReportCategory.infrastructure: ["municipal", "utilities"],
    ReportCategory.gov_delay: ["municipal"],
    ReportCategory.safety: ["police"],
    ReportCategory.other: ["municipal"],
}


def suggest_authority_id(
    category: ReportCategory, authorities: list[Authority]
) -> str | None:
    """Pick the best-matching authority id for a category, if any."""
    if not authorities:
        return None

    preferred_types = CATEGORY_TO_AUTHORITY_TYPES.get(category, [])
    for wanted in preferred_types:
        for authority in authorities:
            if authority.type.lower() == wanted:
                return authority.id

    # No type match: fall back to the first available authority.
    return authorities[0].id
