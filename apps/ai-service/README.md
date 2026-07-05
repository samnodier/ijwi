# IJWI AI Service (`apps/ai-service`)

**Owner:** Backend B (AI)

Node.js + TypeScript + Express service that classifies citizen reports (text + photos), scores urgency, and suggests the right authority. It is called by the Node worker in `apps/api/src/integrations`, never by the frontend directly.

## Providers (pluggable)

Set `AI_PROVIDER` in `.env`:

| Provider | Vision? | Cost | Notes |
|----------|---------|------|-------|
| `rules` | No | Free | Keyword classifier. Default. Works with no API key. |
| `groq` | **Yes** | Free tier | Llama 4 vision model. Needs `GROQ_API_KEY`. |

Groq is OpenAI-compatible and multimodal — it reads the actual photos (flood, crash, pothole) to classify. Get a free key (no credit card) at https://console.groq.com/keys.

### Resilience

When `AI_PROVIDER=groq`, each call is retried once. If Groq is still unreachable (transient error, rate limit, bad key), the service automatically falls back to the `rules` classifier so it never hard-fails. Fallback responses are tagged `"provider": "rules (groq unavailable)"` so you can tell them apart.

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
npm install
cp .env.example .env        # then set AI_PROVIDER and GROQ_API_KEY
npm run dev
```

Check it:

```bash
curl http://localhost:8000/health

curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: dev-internal-secret-change-me" \
  -d '{"reportId":"1","description":"Major flooding, people trapped in cars","authorities":[{"id":"a1","name":"Fire","type":"fire"}]}'
```

## Notes on images

Photos live in MinIO/S3. Because free cloud models cannot reach `localhost`, the Groq provider downloads each image and sends it inline as base64. If an image URL is unreachable, it is skipped and analysis falls back to text only.

## Structure

```
src/
├── index.ts            # Express server entry
├── config.ts           # Env config
├── types.ts            # Zod schemas (the worker ↔ service contract)
├── security.ts         # X-Internal-Secret middleware
├── providers/
│   ├── base.ts         # AIProvider interface
│   ├── rules.ts        # Keyword classifier (default)
│   ├── groq.ts         # Vision provider (Groq)
│   ├── routing.ts      # Category → authority mapping
│   └── index.ts        # getProvider() factory
└── routes/
    ├── analyze.ts      # POST /analyze
    └── summarize.ts    # POST /summarize
```
