# IJWI AI Service (`apps/ai-service`)

**Owner:** Backend B (AI)

FastAPI service that classifies citizen reports (text + photos), scores urgency, and suggests the right authority. It is called by the Node worker in `apps/api/src/integrations`, never by the frontend directly.

## Providers (pluggable)

Set `AI_PROVIDER` in `.env`:

| Provider | Vision? | Cost | Notes |
|----------|---------|------|-------|
| `rules` | No | Free | Keyword classifier. Default. Works with no API key. |
| `groq` | **Yes** | Free tier | Llama 4 vision model. Needs `GROQ_API_KEY`. |

Groq is OpenAI-compatible and multimodal — it reads the actual photos (flood, crash, pothole) to classify. Get a free key (no credit card) at https://console.groq.com/keys.

## Endpoints

All non-health endpoints require the header `X-Internal-Secret: <AI_SERVICE_SECRET>`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness + active provider |
| POST | `/analyze` | Classify one report → category, urgency, authority, summary |
| POST | `/summarize` | Digest many report summaries for the dashboard |

### `POST /analyze`

Request:

```json
{
  "reportId": "uuid",
  "description": "Flooding on Main Street, cars stuck",
  "photoUrls": ["http://localhost:9000/reports/photo1.jpg"],
  "lat": -1.29,
  "lng": 36.82,
  "authorities": [{ "id": "a1", "name": "Fire Dept", "type": "fire" }]
}
```

Response:

```json
{
  "category": "flood",
  "urgency": 5,
  "suggestedAuthorityId": "a1",
  "summary": "Severe flooding with trapped vehicles on Main Street",
  "duplicateOf": null,
  "provider": "groq"
}
```

## Run locally

```bash
cd apps/ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then set AI_PROVIDER and GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

Check it: `curl http://localhost:8000/health`

## Notes on images

Photos live in MinIO/S3. Because free cloud models cannot reach `localhost`, the Groq provider downloads each image and sends it inline as base64. If an image URL is unreachable, it is skipped and analysis falls back to text only.
