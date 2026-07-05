from fastapi import APIRouter, Depends

from app.models.schemas import AnalyzeReportRequest, AnalyzeReportResult
from app.providers import get_provider
from app.security import require_internal_secret

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeReportResult)
async def analyze(
    request: AnalyzeReportRequest,
    _: None = Depends(require_internal_secret),
) -> AnalyzeReportResult:
    provider = get_provider()
    return await provider.analyze(request)
