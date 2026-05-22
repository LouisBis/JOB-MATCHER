# Job Matcher

> Scores every new job offer from Indeed and France Travail against your CV using a local LLM — and sends only the best ones to Telegram.

---

## What you receive

The score is the whole point. Each offer is rated **1 to 10** based on how well it matches your CV. Anything at 7 or above gets pushed to your Telegram:

```text
🎯 8/10 — Développeur Full-Stack TypeScript @ Acme SAS
🔵 Indeed

✅ Exact stack match: TypeScript, React, Node.js
✅ Full remote — matches your preferences
✅ Mid/senior level — consistent with your experience
⚠️  5 years required, you have 4

Fast-growing B2B fintech. Strong technical match,
slight gap on seniority.

🔗 View offer → indeed.com/...
```

Offers below your threshold are silently skipped — no notification, no noise. If the pipeline fails, you get a Telegram alert instead.

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
          Filter score ≥ 7
                  │
                  ▼
         Send to Telegram

          ↕ on any error
     Alert on Telegram
```

Runs on a configurable cron schedule (e.g. every 3 hours). Indeed is fetched via [Apify](https://apify.com) (~$0.10–$1.00/1,000 results). France Travail uses its direct public API (free). **CV and scoring stay fully local — nothing sensitive leaves your machine.**

---

## Stack

| Layer         | Tool                                          |
| ------------- | --------------------------------------------- |
| Orchestration | n8n (Docker)                                  |
| LLM           | Ollama · llama3.2:3b (native, Metal GPU)      |
| Deduplication | n8n static data                               |
| Notifications | Telegram Bot API                              |
| Job sources   | Indeed (via Apify) · France Travail (API)     |

---

## Setup

**Prerequisites:** Docker ≥ 24, Docker Compose ≥ 2, [Ollama](https://ollama.com/download) installed natively, and a free [Apify](https://apify.com) account.

### 1. Install Ollama and pull the model

Download the native macOS app from **[ollama.com/download](https://ollama.com/download)** — do not use `brew install ollama`, which ships an outdated version without Metal GPU support.

Once installed, pull the model:

```bash
ollama pull llama3.2:3b
```

### 2. Clone & configure

```bash
git clone https://github.com/yourname/job-matcher.git
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
FT_DEPARTEMENT=           # department code (e.g. 75), or leave empty for national

# Scoring
MIN_SCORE=7               # minimum score to trigger a notification

# Telegram
TELEGRAM_BOT_TOKEN=       # from @BotFather
TELEGRAM_CHAT_ID=         # your personal chat ID
```

**France Travail setup** (optional): register at [francetravail.io](https://francetravail.io), create an application, and subscribe to the **Offres d'emploi v2** API to get your credentials.

### 3. Add your CV

```bash
cp your-cv.txt data/cv/cv.txt
```

The CV is read at scoring time — no restart needed to update it.

### 4. Start the stack

```bash
docker compose up -d
```

The workflow is built automatically from source and imported into n8n on every startup.

### 5. Connect Telegram credentials

In n8n at `http://localhost:5678`:

1. **Credentials → New → Telegram API** → paste your bot token → name it **`Telegram`** → Save
2. Open each workflow → nodes using Telegram → select the **`Telegram`** credential → Save
3. **Activate** the **Job Matcher — Error Handler** workflow (toggle ON)

---

## Project structure

```text
job-matcher/
├── docker-compose.yml
├── .env.example
├── package.json                          ← npm run build
├── scripts/
│   └── build-workflow.js                 ← injects code files into workflow JSONs
├── n8n/
│   ├── code/
│   │   ├── config.js                     ← reads env vars, bridges to HTTP nodes
│   │   ├── normalize-indeed.js           ← maps Indeed schema to common format
│   │   ├── fetch-ft.js                   ← OAuth + fetch + normalize France Travail
│   │   ├── deduplicate.js                ← skips already-seen offers
│   │   ├── prepare-request.js            ← builds the LLM prompt
│   │   ├── parse-score.js                ← parses LLM JSON response
│   │   └── format-error.js               ← formats pipeline errors for Telegram
│   └── workflows/
│       ├── job-matcher.template.json     ← main workflow structure
│       └── error-handler.template.json   ← error alert workflow
├── data/
│   └── cv/cv.txt                         ← your CV (git-ignored)
└── docs/
    └── SCORING_PROMPT.md                 ← LLM prompt documentation
```

> To edit the workflow logic, modify files in `n8n/code/` then run `npm run build` before `docker compose up -d`.
