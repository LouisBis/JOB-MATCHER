# Job Matcher

> Scores every new job offer from Indeed against your CV using a local LLM — and sends only the best ones to Telegram.

---

## What you receive

The score is the whole point. Each offer is rated **1 to 10** based on how well it matches your CV. Anything at 7 or above gets pushed to your Telegram:

```text
🎯 8/10 — Full-Stack TypeScript Developer @ Acme SAS

✅ Exact stack match: TypeScript, React, Node.js
✅ Full remote — matches your preferences
✅ Mid/senior level — consistent with your experience
⚠️  5 years required, you have 4

Fast-growing B2B fintech. Strong technical match,
slight gap on seniority.

📍 Paris · Full remote · Full-time
🔗 View offer → indeed.com/...
```

Offers below your threshold are silently skipped — no notification, no noise.

---

## How it works

```text
Apify → Indeed
         │
         ▼
   Fetch new offers            ← valig/indeed-jobs-scraper actor
         │
         ▼
   Deduplicate                 ← n8n static data, skips already-seen offers
         │
         ▼
   Score against your CV       ← Ollama + Mistral 7B (local)
         │                        returns { score, reasons, concerns, summary }
         ▼
   Filter  score ≥ 7
         │
         ▼
   Send to Telegram
```

Runs on a configurable cron schedule (e.g. every 3 hours). Job listings are fetched via [Apify](https://apify.com) (~$0.10/1,000 results). **CV and scoring stay fully local — nothing sensitive leaves your machine.**

---

## Stack

| Layer         | Tool                |
| ------------- | ------------------- |
| Orchestration | n8n (Docker)        |
| LLM           | Ollama · Mistral 7B |
| Deduplication | n8n static data     |
| Notifications | Telegram Bot API    |
| Job source    | Indeed via Apify    |

---

## Setup

**Prerequisites:** Docker ≥ 24, Docker Compose ≥ 2, 8 GB RAM for the local LLM, and a free [Apify](https://apify.com) account.

### 1. Clone & configure

```bash
git clone https://github.com/yourname/job-matcher.git
cd job-matcher
cp .env.example .env
```

Open `.env` and fill in:

```dotenv
# Apify — job source
APIFY_TOKEN=              # apify.com → Settings → Integrations
APIFY_QUERY=frontend developer
APIFY_LOCATION=Paris, France

# Scoring
MIN_SCORE=7               # minimum score to trigger a notification

# Telegram
TELEGRAM_BOT_TOKEN=       # from @BotFather
TELEGRAM_CHAT_ID=         # your personal chat ID
```

### 2. Add your CV

```bash
cp your-cv.txt data/cv/cv.txt
```

The CV is read at scoring time — no restart needed to update it.

### 3. Start the stack

```bash
docker compose up -d
```

On first run, Ollama pulls Mistral 7B (~4 GB).

### 4. Connect Telegram credentials

In n8n at `http://localhost:5678` → **Credentials → New → Telegram API** → paste your bot token → link it to the **Send to Telegram** node.

---

## Project structure

```text
job-matcher/
├── docker-compose.yml
├── .env.example
├── n8n/workflows/
│   └── job-matcher.json      ← auto-imported on docker compose up
├── data/
│   └── cv/cv.txt             ← your CV (git-ignored)
└── docs/
    └── SCORING_PROMPT.md     ← LLM prompt documentation
```
