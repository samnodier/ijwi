from fastapi import FastAPI

from app.config import settings
from app.routes import analyze, summarize

app = FastAPI(title="IJWI AI Service", version="0.1.0")

app.include_router(analyze.router)
app.include_router(summarize.router)


@app.get("/health")
async def health() -> dict:
    """Liveness check + which provider is active."""
    return {"status": "ok", "provider": settings.ai_provider}
