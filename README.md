# IJWI — Citizen Reporting Platform for Rwanda

_"Ijwi" means "voice" in Kinyarwanda._ IJWI gives every citizen a single place to report a community issue, reach the right authority automatically, and look up any official emergency or government contact number.

Live problems it addresses: accidents, flooding, damaged infrastructure, utility outages, and stalled or delayed public projects — issues where reaching the correct institution quickly makes a real difference.

Repository: https://github.com/samnodier/ijwi

---

## Table of contents

- [Why we built it](#why-we-built-it)
- [The hackathon and how it was built](#the-hackathon-and-how-it-was-built)
- [What it does](#what-it-does)
- [How a report flows through the system](#how-a-report-flows-through-the-system)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Team and ownership](#team-and-ownership)

---

## Why we built it

Reporting a problem in a community is harder than it should be:

- **Scattered contacts.** Emergency and government numbers (112, 912, 111, 2727, 3535, 9099 and many more) are spread across dozens of separate websites and posters. There is no single, trustworthy entry point.
- **Wrong door, lost time.** Citizens often do not know which institution handles a given problem, so reports bounce between offices or never arrive at all.
- **No feedback loop.** After a call or a message, there is little visibility into whether anything actually happens.
- **Projects stall silently.** Delayed and unfinished public works frequently go unreported until they reach the headlines.

This is not hypothetical. Accountability for delayed projects and the state of unfinished infrastructure (for example, Kigali's drainage works) are recurring national conversations in Rwanda. IJWI turns that top-down pressure into a bottom-up tool: any citizen can flag an issue the moment they see it, attach a photo and location, and have it routed to the responsible authority.

## The hackathon and how it was built

IJWI was built as a hackathon project, using [Cursor](https://cursor.com) as the primary AI-assisted development environment throughout. Cursor was used at every stage of the build:

- **Research.** Gathering and cross-checking official hotline numbers from more than fifteen `.gov.rw` sources, then compiling them into a structured, searchable directory.
- **Scaffolding.** Generating the monorepo layout, the React + Vite + TypeScript frontend, the Express + TypeScript services, and a typed API client instead of hand-wiring boilerplate.
- **Integration and debugging.** Wiring the report pipeline end to end (photo upload, EXIF extraction, AI classification, authority routing, SMS dispatch) and diagnosing environment and Git issues along the way.
- **Git workflow.** Inspecting branches, merging team contributions, and keeping `main` deployable.
- **Content and design.** Authoring documentation and producing the presentation deck under `docs/`.

The team worked in parallel across clearly separated areas of the monorepo (frontend, core backend, and integrations/AI), which allowed independent progress that merged cleanly into a single working product.

## What it does

- **Report an issue.** A citizen submits a description, a photo, and a location in seconds — without needing to know which office is responsible.
- **Automatic routing.** The report is classified and routed to the appropriate authority based on its category, with a resilient fallback so a report is always dispatched even if classification is uncertain.
- **Real-time alerts.** The responsible authority is notified by SMS. Delivery works through Africa's Talking (well suited to Rwanda and East Africa), with a Twilio fallback and a log-only mode so the system runs with zero configuration during development.
- **Unified numbers directory.** A verified list of official emergency and government contacts, compiled from `.gov.rw` sources, with guidance on who to contact for a given problem.
- **Authority dashboard.** Officials receive a structured inbox of incoming reports instead of scattered calls and messages.
- **AI summary digest.** An AI-generated digest surfaces patterns and priorities so authorities can act on what matters first.

A sample of the verified directory that powers the numbers page:

| Emergency | Services | Utilities |
|-----------|----------|-----------|
| 112 Police | 9099 Irembo | 2727 Electricity |
| 912 Ambulance | 3004 RRA | 3535 Water |
| 111 Fire | 4044 RSSB | 3988 RURA |
| 166 RIB | 1415 RDB | 3260 City of Kigali |
| 3512 GBV | 9090 Immigration | 199 Ombudsman |

## How a report flows through the system

1. **Submit.** The frontend sends the report as `multipart/form-data` (description, photo, optional location) to the API.
2. **Store and enrich.** The API uploads the photo to Cloudinary and extracts EXIF metadata, including GPS coordinates and capture time, so the location can be inferred from the image if the citizen did not provide one.
3. **Classify.** When configured, the API calls the AI service, which reads the text and the actual photo to determine a category, an urgency score, and a suggested authority.
4. **Route and dispatch.** The report is mapped to the responsible authority and an SMS alert is sent. If the AI service is unavailable or the category is ambiguous, the report is still dispatched using the citizen-provided category, so an alert is never lost.
5. **Confirm.** The citizen sees a confirmation with a plain-language summary of what the system understood. Routing details are intentionally not exposed to the citizen.

## Architecture

IJWI is a monorepo composed of three independently deployable applications plus shared assets:

```
apps/
├── web/          React + Vite frontend (citizen app and authority dashboard)
├── api/          Node.js + Express core API (auth, reports, storage, routing, dispatch)
└── ai-service/   Node.js + Express AI service (photo + text classification, urgency, summaries)
packages/
└── shared-types/ Types shared across apps
database/         SQL migrations and seed data
docs/             Presentation and supporting material
render.yaml       Render blueprint for the two backend services
```

The frontend never calls the AI service directly. It talks to the core API, which in turn calls the AI service over HTTP using an internal shared secret. This keeps the classification logic behind the backend and lets the AI provider be swapped without touching the client.

## Technology stack

| Area | Technology |
|------|-----------|
| Frontend | React, Vite, TypeScript |
| Core API | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (Neon serverless) with Drizzle ORM |
| Media storage | Cloudinary (upload and EXIF/GPS extraction via `exifr`) |
| AI service | Node.js, Express, pluggable providers (rules-based default, Groq Llama vision) |
| Messaging | Africa's Talking (primary), Twilio (fallback), log-only (no config) |
| Auth | JWT with refresh tokens; optional Google Sign-In |
| API docs | Swagger UI |
| Deployment | Vercel (frontend), Render (API and AI service) |

## Repository structure

Each application manages its own dependencies and can be run on its own. There is no root package manager; install and run inside each app directory. The `apps/web` and `apps/ai-service` directories contain their own detailed READMEs.

## Getting started

### Prerequisites

- Node.js 20 or newer and npm
- A PostgreSQL database (a free Neon instance works well)
- A Cloudinary account (for photo upload and EXIF extraction)
- Optional: a Groq API key (for photo-aware AI classification)
- Optional: an Africa's Talking account (for SMS delivery)

### 1. Core API (`apps/api`)

```bash
cd apps/api
npm install
cp .env.example .env     # fill in the values described below
npm run db:migrate       # apply the database schema
npm run dev              # starts on http://localhost:3000
```

### 2. AI service (`apps/ai-service`)

```bash
cd apps/ai-service
npm install
cp .env.example .env     # set AI_PROVIDER and, for vision, GROQ_API_KEY
npm run dev              # starts on http://localhost:8000
```

### 3. Frontend (`apps/web`)

```bash
cd apps/web
npm install
npm run dev              # starts on http://localhost:5173
```

In development the frontend proxies requests from `/api/*` to `http://localhost:3000`, so no additional configuration is required to connect the two locally.

## Environment variables

Never commit real secrets. Each app ships an `.env.example` documenting the full set of variables; the notable ones are below.

### `apps/api/.env`

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled). |
| `PORT` | API port (defaults to 3000). |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins. Leave blank to allow all (development and demos). |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Authentication token signing. |
| `GOOGLE_CLIENT_ID` | Optional Google Sign-In client ID. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media storage and EXIF extraction. |
| `AI_SERVICE_URL`, `AI_SERVICE_SECRET` | Location of and shared secret for the AI service. Leave `AI_SERVICE_URL` blank to route on the citizen-provided category only. |
| `DISABLE_AI` | Set to `true` to skip AI classification; reports are still always dispatched. |
| `AT_API_KEY`, `AT_USERNAME`, `AT_FROM` | Africa's Talking credentials. Use `sandbox` as the username to test against the simulator. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `NOTIFY_CHANNEL` | Twilio fallback for SMS or WhatsApp. |
| `DEMO_PHONE` | Optional. Routes every alert to a single phone number for demonstrations. |

### `apps/ai-service/.env`

| Variable | Purpose |
|----------|---------|
| `AI_PROVIDER` | `rules` (default, no key required) or `groq` (photo-aware). |
| `GROQ_API_KEY` | Required when `AI_PROVIDER=groq`. |
| `AI_SERVICE_SECRET` | Must match the value used by the core API. |

### `apps/web/.env`

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL in production. In development the Vite proxy handles `/api`. |

## Deployment

- **Frontend** deploys to Vercel from `apps/web`. Set `VITE_API_URL` to the deployed API URL.
- **API and AI service** deploy to Render using the `render.yaml` blueprint at the repository root, which defines both as web services. Configure each service's environment variables in the Render dashboard.
- **Database** is hosted on Neon; use the pooled connection string.
- **Media** is stored on Cloudinary.

When deploying, set `CORS_ORIGIN` on the API to the deployed frontend origin so the browser can call the backend across origins.

## Team and ownership

IJWI was built collaboratively, with responsibilities split across the monorepo:

- **Frontend** — the citizen reporting app, the numbers directory, and the authority dashboard (`apps/web`).
- **Backend A** — core API, authentication, database schema, and storage (`apps/api`).
- **Backend B** — integrations, routing and dispatch, and the AI service (`apps/api/src/lib`, `apps/ai-service`).

See the per-application READMEs in `apps/web` and `apps/ai-service` for deeper technical detail.
