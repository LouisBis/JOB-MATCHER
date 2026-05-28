# Job Matcher

> Web app that scores job offers from Indeed and France Travail against your CV using a local LLM — and surfaces only the best ones in a clean dashboard.

---

## What you get

A scored, filterable feed of job offers — each rated **1 to 10** based on how well it matches your CV. The dashboard is the main interface; Telegram notifications are an optional push layer on top.

```text
🎯 9/10 — Développeur Angular Senior @ Acme SAS
🔵 Indeed

✅ Angular 19 — stack exacte
✅ Full remote
✅ Niveau senior — cohérent avec le profil
⚠️  6 ans requis

Scale-up B2B SaaS, équipe front de 4 devs.
Stack Angular + NestJS, contexte greenfield.

🔗 View offer → indeed.com/...
```

---

## How it works

```text
Apify → Indeed ──────────────────────────────────────┐
                                                      ├→ Normalize → Merge
France Travail API (OAuth2) ─────────────────────────┘
                  │
                  ▼
          Deduplicate             ← skips already-seen offers
                  │
                  ▼
    Score against your CV         ← Ollama (native, Metal GPU)
                  │                  returns { score, reasons, concerns, summary }
                  ▼
          Filter score ≥ MIN_SCORE
                  │
                  ├──► Angular dashboard   ← main interface
                  └──► Telegram (optional) ← push notification
```

Runs on a configurable cron schedule. Indeed is fetched via [Apify](https://apify.com); France Travail uses its direct public API (free). **CV and scoring are fully local — nothing sensitive leaves your machine.**

---

## Stack

| Layer         | Tool                                      |
| ------------- | ----------------------------------------- |
| Frontend      | Angular 19 (standalone, signals)          |
| Orchestration | n8n (Docker)                              |
| LLM           | Ollama · llama3.2:3b (native, Metal GPU)  |
| Deduplication | n8n static data                           |
| Notifications | Telegram Bot API (optional)               |
| Job sources   | Indeed (via Apify) · France Travail (API) |

---

## Setup

**Prerequisites:** Docker ≥ 24, Docker Compose ≥ 2, [Ollama](https://ollama.com/download) installed natively, and a free [Apify](https://apify.com) account.

### 1. Install Ollama and pull the model

Download the native macOS app from **[ollama.com/download](https://ollama.com/download)** — do not use `brew install ollama`, which ships an outdated version without Metal GPU support.

```bash
ollama pull llama3.2:3b
```

### 2. Clone & configure

```bash
git clone https://github.com/LouisBis/job-matcher.git
cd job-matcher
cp .env.example .env
```

Open `.env` and fill in:

```dotenv
# Apify — Indeed source
APIFY_TOKEN=              # apify.com → Settings → Integrations
APIFY_QUERY=frontend developer
APIFY_LOCATION=Paris, France

# France Travail (optional — leave blank to disable)
FT_CLIENT_ID=             # francetravail.io → My applications → Client ID
FT_CLIENT_SECRET=         # francetravail.io → My applications → Client Secret
FT_DEPARTEMENT=           # e.g. 75 for Paris, or leave empty for national

# Scoring
FILTER_EXCLUDE=           # comma-separated title keywords to skip (e.g. java,devops)
MIN_SCORE=7

# Telegram (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 3. Add your CV

```bash
cp your-cv.txt data/cv/cv.txt
```

### 4. Start the stack

```bash
docker compose up -d
```

This starts three services:

- **n8n** at `http://localhost:5678` — workflow engine
- **n8n-init** — builds and imports the workflow on startup (then exits)
- **frontend** at `http://localhost:4200` — Angular dashboard

### 5. Connect Telegram credentials (optional)

In n8n at `http://localhost:5678`:

1. **Credentials → New → Telegram API** → paste your bot token → name it **`Telegram`** → Save
2. Open each workflow → Telegram nodes → select the **`Telegram`** credential → Save
3. **Activate** the **Job Matcher — Error Handler** workflow (toggle ON)

---

## Project structure

```text
job-matcher/
├── docker-compose.yml
├── .env.example
├── package.json                          ← npm run build (n8n workflows)
├── scripts/
│   └── build-workflow.js                 ← injects code files into workflow JSONs
├── frontend/                             ← Angular app (job-matcher-frontend)
│   ├── Dockerfile.dev                    ← dev server container
│   ├── src/
│   │   ├── environments/                 ← dev (n8n) + github-pages (mock)
│   │   ├── assets/mock/                  ← curated JSON for static demo
│   │   └── app/
│   │       ├── core/                     ← models, services
│   │       └── features/                 ← offers, preferences
│   └── angular.json                      ← includes github-pages build config
├── n8n/
│   ├── code/                             ← source of truth for all Code nodes
│   └── workflows/
│       ├── job-matcher.template.json
│       └── error-handler.template.json
├── data/
│   └── cv/cv.txt                         ← your CV (git-ignored)
└── docs/
    └── SCORING_PROMPT.md
```

> To edit the n8n workflow logic, modify files in `n8n/code/` then run `npm run build` before `docker compose up -d`.

---

## Demo (GitHub Pages)

A static demo with curated mock data is available at:
`https://LouisBis.github.io/JOB-MATCHER/`

No backend needed — the demo runs entirely in the browser against `assets/mock/`.
