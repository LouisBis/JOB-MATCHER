# Job Matcher

> Web app that scores job offers from Indeed and France Travail against your CV using a **fully local LLM** — and surfaces only the best matches in a clean Angular dashboard.

<p align="center">
  <a href="https://louisbis.github.io/JOB-MATCHER/">
    <img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-4F46E5?style=for-the-badge&logo=github" alt="Live Demo" />
  </a>
</p>

## Built with

![Angular 21](https://img.shields.io/badge/Angular%2021-DD0031?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-EA4B71?style=flat-square&logo=n8n&logoColor=white)
![Ollama llama3.2:3b Metal GPU](https://img.shields.io/badge/Ollama-llama3.2%3A3b%20·%20Metal%20GPU-black?style=flat-square)
![Untitled UI Design System](https://img.shields.io/badge/Untitled%20UI-Design%20System-6172F3?style=flat-square)
![Style Dictionary](https://img.shields.io/badge/Style%20Dictionary-Tokens-F97316?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## What you get

A scored, filterable feed of job offers — each rated **1 to 10** based on how well it matches your CV. The dashboard is the main interface; Telegram notifications are an optional push layer on top.

```text
🎯 9/10 — Développeur Angular Senior @ Acme SAS
🔵 Indeed

✅ Angular 21 — stack exacte
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
| Frontend      | Angular 21 (standalone, signals)          |
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
git clone https://github.com/LouisBis/JOB-MATCHER.git
cd JOB-MATCHER
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

> **First run only:** open the **"Job Matcher API"** workflow in n8n and click **Publish**. This activates the webhooks used by the dashboard. The state persists in the n8n volume — no need to repeat unless you wipe volumes with `docker compose down -v`.

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
├── .github/workflows/
│   └── deploy-gh-pages.yml               ← auto-deploy to GitHub Pages on push to main
├── frontend/                             ← Angular 21 app
│   ├── design-tokens/                    ← Untitled UI tokens (JSON, source of truth)
│   ├── build-tokens.mjs                  ← Style Dictionary v5 — tokens → CSS variables
│   ├── Dockerfile.dev                    ← dev server container
│   ├── public/
│   │   └── assets/mock/                  ← curated JSON for GitHub Pages demo
│   ├── src/
│   │   ├── environments/                 ← dev (n8n) + github-pages (mock)
│   │   └── app/
│   │       ├── core/                     ← models, services, navbar, i18n
│   │       └── features/                 ← offers (list, detail), preferences
│   └── angular.json                      ← build configs: dev / mock / github-pages
├── n8n/
│   ├── code/                             ← source of truth for all Code nodes
│   └── workflows/
│       ├── job-matcher.template.json
│       ├── job-matcher-api.template.json  ← API webhooks (GET /jobs, GET|POST /preferences)
│       └── error-handler.template.json
├── data/
│   ├── cv/cv.txt                         ← your CV (git-ignored)
│   ├── offers/offers.json                ← scored offers written by the pipeline (git-ignored)
│   └── preferences/preferences.json     ← user preferences (git-ignored)
└── docs/
    ├── SCORING_PROMPT.md
    └── FRONTEND.md                       ← frontend architecture
```

> To edit the n8n workflow logic, modify files in `n8n/code/` then run `npm run build` before `docker compose up -d`.

---

## Demo (GitHub Pages)

A static demo with curated mock data is available at:
`https://LouisBis.github.io/JOB-MATCHER/`

No backend needed — the demo runs entirely in the browser against `assets/mock/`.
