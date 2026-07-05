# IJWI Frontend (`apps/web`)

**Owner:** Frontend team

React + Vite + TypeScript app for citizen reporting and authority dashboards.

## Folder structure

```
src/
├── api/           # API client
├── components/    # Reusable UI (ReportForm, PhotoUpload, etc.)
├── hooks/         # Data hooks
└── pages/         # Route pages
    └── dashboard/ # Authority views
```

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/report` | Submit a report |
| `/numbers` | Emergency numbers |
| `/dashboard` | Authority inbox |
| `/dashboard/summary` | AI digest |

## Run locally

```bash
cd apps/web
npm install
npm run dev
```

App runs at http://localhost:5173. API requests to `/api/*` proxy to http://localhost:3000.

## Env

Optional: `VITE_API_URL` — override API base URL (defaults to `/api` proxy).
