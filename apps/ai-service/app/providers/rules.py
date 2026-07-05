from app.models.schemas import (
    AnalyzeReportRequest,
    AnalyzeReportResult,
    ReportCategory,
    SummarizeRequest,
    SummarizeResult,
)
from app.providers.base import AIProvider
from app.providers.routing import suggest_authority_id

# Keyword buckets used to classify report text. Order matters: the category
# with the most keyword hits wins, ties broken by this ordering.
CATEGORY_KEYWORDS: dict[ReportCategory, list[str]] = {
    ReportCategory.flood: ["flood", "water", "rain", "overflow", "drainage", "submerged"],
    ReportCategory.accident: ["accident", "crash", "collision", "injured", "hit", "vehicle"],
    ReportCategory.infrastructure: [
        "pothole", "road", "bridge", "pipe", "power", "electricity", "streetlight", "broken",
    ],
    ReportCategory.gov_delay: ["delay", "unfinished", "stalled", "abandoned", "project", "months"],
    ReportCategory.safety: ["fire", "crime", "theft", "assault", "danger", "gun", "violence"],
}

# High-urgency signals that bump the score regardless of category.
URGENT_WORDS = ["trapped", "dying", "urgent", "emergency", "help", "injured", "fire", "drowning"]


class RulesProvider(AIProvider):
    """Zero-cost keyword classifier. Ignores images; text only."""

    name = "rules"

    async def analyze(self, request: AnalyzeReportRequest) -> AnalyzeReportResult:
        text = request.description.lower()

        scores: dict[ReportCategory, int] = {}
        for category, keywords in CATEGORY_KEYWORDS.items():
            hits = sum(1 for word in keywords if word in text)
            if hits:
                scores[category] = hits

        category = max(scores, key=scores.get) if scores else ReportCategory.other

        urgency = 2
        if scores:
            urgency = 3
        urgency += sum(1 for word in URGENT_WORDS if word in text)
        urgency = max(1, min(5, urgency))

        summary = request.description.strip() or "Citizen report with no description."
        if len(summary) > 120:
            summary = summary[:117] + "..."

        return AnalyzeReportResult(
            category=category,
            urgency=urgency,
            suggested_authority_id=suggest_authority_id(category, request.authorities),
            summary=summary,
            duplicate_of=None,
            provider=self.name,
        )

    async def summarize(self, request: SummarizeRequest) -> SummarizeResult:
        count = len(request.summaries)
        if count == 0:
            digest = "No reports to summarize."
        else:
            preview = "; ".join(request.summaries[:5])
            digest = f"{count} report(s). Recent: {preview}"

        return SummarizeResult(digest=digest, provider=self.name)
