import base64
import json

import httpx
from groq import AsyncGroq

from app.config import settings
from app.models.schemas import (
    AnalyzeReportRequest,
    AnalyzeReportResult,
    ReportCategory,
    SummarizeRequest,
    SummarizeResult,
)
from app.providers.base import AIProvider
from app.providers.routing import suggest_authority_id

# Groq's multimodal models accept at most 5 images per request.
MAX_IMAGES = 5

ANALYZE_SYSTEM_PROMPT = """You are a civic incident triage assistant for IJWI, a platform where \
citizens report community problems. Analyze the report text and any photos, then respond with a \
STRICT JSON object (no prose) using exactly these keys:
{
  "category": one of ["flood","accident","infrastructure","gov_delay","safety","other"],
  "urgency": integer 1-5 (5 = life-threatening, immediate response needed),
  "summary": one short sentence describing the incident,
  "duplicate": false
}
Base the category and urgency on what you actually see in the photos and read in the text."""


class GroqProvider(AIProvider):
    """Vision-capable provider using Groq's free-tier multimodal models."""

    name = "groq"

    def __init__(self) -> None:
        if not settings.groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to apps/ai-service/.env or set AI_PROVIDER=rules."
            )
        self.client = AsyncGroq(api_key=settings.groq_api_key)
        self.model = settings.groq_model

    async def _fetch_image_data_urls(self, urls: list[str]) -> list[str]:
        """Download images and encode them as base64 data URLs Groq can read."""
        data_urls: list[str] = []
        async with httpx.AsyncClient(timeout=15) as http:
            for url in urls[:MAX_IMAGES]:
                try:
                    resp = await http.get(url)
                    resp.raise_for_status()
                except httpx.HTTPError:
                    # Skip unreachable images (e.g. private MinIO URL); text still works.
                    continue
                mime = resp.headers.get("content-type", "image/jpeg").split(";")[0]
                encoded = base64.b64encode(resp.content).decode("utf-8")
                data_urls.append(f"data:{mime};base64,{encoded}")
        return data_urls

    async def analyze(self, request: AnalyzeReportRequest) -> AnalyzeReportResult:
        content: list[dict] = [
            {
                "type": "text",
                "text": f"Report description: {request.description or '(none provided)'}",
            }
        ]
        for data_url in await self._fetch_image_data_urls(request.photo_urls):
            content.append({"type": "image_url", "image_url": {"url": data_url}})

        completion = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": ANALYZE_SYSTEM_PROMPT},
                {"role": "user", "content": content},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        parsed = json.loads(completion.choices[0].message.content or "{}")

        try:
            category = ReportCategory(parsed.get("category", "other"))
        except ValueError:
            category = ReportCategory.other

        urgency = int(parsed.get("urgency", 3))
        urgency = max(1, min(5, urgency))

        summary = str(parsed.get("summary") or request.description or "Citizen report.").strip()

        return AnalyzeReportResult(
            category=category,
            urgency=urgency,
            suggested_authority_id=suggest_authority_id(category, request.authorities),
            summary=summary,
            duplicate_of=None,
            provider=self.name,
        )

    async def summarize(self, request: SummarizeRequest) -> SummarizeResult:
        if not request.summaries:
            return SummarizeResult(digest="No reports to summarize.", provider=self.name)

        joined = "\n- ".join(request.summaries)
        completion = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Summarize these civic reports into a 2-3 sentence briefing for "
                    "authorities. Highlight the most urgent and most common issues.",
                },
                {"role": "user", "content": f"Reports:\n- {joined}"},
            ],
            temperature=0.3,
        )

        digest = (completion.choices[0].message.content or "").strip()
        return SummarizeResult(digest=digest, provider=self.name)
