from fastapi import APIRouter, Depends

from app.models.schemas import SummarizeRequest, SummarizeResult
from app.providers import get_provider
from app.security import require_internal_secret

router = APIRouter()


@router.post("/summarize", response_model=SummarizeResult)
async def summarize(
    request: SummarizeRequest,
    _: None = Depends(require_internal_secret),
) -> SummarizeResult:
    provider = get_provider()
    return await provider.summarize(request)
