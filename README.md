# Job Matcher

> Scores every new job offer from Welcome to the Jungle against your CV using a local LLM — and sends only the best ones to Telegram.

---

## What you receive

The score is the whole point. Each offer is rated **1 to 10** based on how well it matches your CV. Anything at 7 or above gets pushed to your Telegram:

```
🎯 8/10 — Full-Stack TypeScript Developer @ Acme SAS

✅ Exact stack match: TypeScript, React, Node.js
✅ Full remote — matches your preferences
✅ Mid/senior level — consistent with your experience
⚠️  5 years required, you have 4

Fast-growing B2B fintech. Strong technical match,
slight gap on seniority.

📍 Paris · Full remote · Full-time
🔗 View offer → welcometothejungle.com/...
```

Offers below your threshold are silently skipped — no notification, no noise.

---

## How it works

```
Welcome to the Jungle (RSS)
         │
         ▼
   Fetch new offers
         │
         ▼
   Deduplicate                ← n8n static data, skips already-seen offers
         │
         ▼
   Score against your CV      ← Ollama + Mistral 7B
         │                       returns { score, reasons, concerns, summary }
         ▼
   Filter  score ≥ 7
         │
         ▼
   Send to Telegram
```

Runs on a configurable cron schedule (e.g. every 3 hours), fully local in Docker. **No data leaves your machine.**

---

## Stack

| Layer | Tool |
|---|---|
| Orchestration | n8n (Docker) |
| LLM | Ollama · Mistral 7B |
| Deduplication | n8n static data |
| Notifications | Telegram Bot API |
| Job source | Welcome to the Jungle RSS |

---

## Setup

**Prerequisites:** Docker ≥ 24, Docker Compose ≥ 2, and 8 GB RAM for the local LLM.

### 1. Clone & configure

```bash
git clone https://github.com/yourname/job-matcher.git
cd job-matcher
cp .env.example .env
```

Open `.env` and fill in:

```dotenv
TELEGRAM_BOT_TOKEN=       # from @BotFather
TELEGRAM_CHAT_ID=         # your personal chat ID
WTTJ_RSS_URL=             # your filtered WTTJ search URL
MIN_SCORE=7               # minimum score to trigger a notification
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

### 4. Import the workflow

1. Open n8n at `http://localhost:5678`
2. **Settings → Import workflow** → select `n8n/workflows/job-matcher.json`
3. Activate the workflow

---

## Project structure

```
job-matcher/
├── docker-compose.yml
├── .env.example
├── n8n/workflows/
│   └── job-matcher.json      ← import this into n8n
├── data/
│   └── cv/cv.txt             ← your CV (git-ignored)
└── docs/
    └── SCORING_PROMPT.md     ← LLM prompt documentation
```
