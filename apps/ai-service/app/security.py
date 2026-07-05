from fastapi import Header, HTTPException, status

from app.config import settings


async def require_internal_secret(x_internal_secret: str = Header(default="")) -> None:
    """Reject requests that do not carry the shared internal secret."""
    if x_internal_secret != settings.ai_service_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Internal-Secret header.",
        )
