from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ReportCategory(str, Enum):
    flood = "flood"
    accident = "accident"
    infrastructure = "infrastructure"
    gov_delay = "gov_delay"
    safety = "safety"
    other = "other"


class Authority(BaseModel):
    id: str
    name: str
    type: str


class AnalyzeReportRequest(BaseModel):
    """Payload sent by the Node worker for a single report."""

    report_id: str = Field(alias="reportId")
    description: str = ""
    photo_urls: list[str] = Field(default_factory=list, alias="photoUrls")
    lat: Optional[float] = None
    lng: Optional[float] = None
    authorities: list[Authority] = Field(default_factory=list)

    model_config = {"populate_by_name": True}


class AnalyzeReportResult(BaseModel):
    """Structured analysis returned to the worker."""

    category: ReportCategory
    urgency: int = Field(ge=1, le=5)
    suggested_authority_id: Optional[str] = Field(default=None, alias="suggestedAuthorityId")
    summary: str
    duplicate_of: Optional[str] = Field(default=None, alias="duplicateOf")
    provider: str

    model_config = {"populate_by_name": True}


class SummarizeRequest(BaseModel):
    summaries: list[str] = Field(default_factory=list)


class SummarizeResult(BaseModel):
    digest: str
    provider: str
