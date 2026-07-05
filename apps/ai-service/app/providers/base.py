from abc import ABC, abstractmethod

from app.models.schemas import (
    AnalyzeReportRequest,
    AnalyzeReportResult,
    SummarizeRequest,
    SummarizeResult,
)


class AIProvider(ABC):
    """Interface every provider implements so they are interchangeable."""

    name: str = "base"

    @abstractmethod
    async def analyze(self, request: AnalyzeReportRequest) -> AnalyzeReportResult:
        """Classify a single report and suggest an authority."""

    @abstractmethod
    async def summarize(self, request: SummarizeRequest) -> SummarizeResult:
        """Produce a short digest of many report summaries."""
