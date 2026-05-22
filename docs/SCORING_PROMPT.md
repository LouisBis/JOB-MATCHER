# Scoring Prompt

The scoring logic lives in [n8n/code/prepare-request.js](../n8n/code/prepare-request.js). For each new offer, it builds a prompt with the candidate's CV and the normalized offer data, then asks the local LLM to return a structured JSON score.

---

## System prompt

The model is given a recruiter persona via Ollama's `system` field, separate from the user prompt:

```text
You are an experienced tech recruiter.
Your job is to evaluate how well a job offer matches a candidate's profile.
You read CVs carefully to infer the candidate's domain (frontend, backend, etc.),
preferred contract type (CDI, freelance, etc.), seniority, and tech stack.
You are strict: a domain or contract mismatch is a dealbreaker, not a minor concern.
```

---

## Prompt template

```text
Score the following job offer against the candidate CV.

Rules:
- Infer the candidate's preferred role, contract type, and seniority from the CV
- A fundamental mismatch (wrong domain, wrong contract type) must result in a score of 1 to 3
- A score of 8 to 10 requires strong alignment on stack, seniority, and contract type

Return ONLY a valid JSON object with these exact keys:
  score (integer 1-10)
  match_reasons (array of strings)
  concerns (array of strings)
  summary (string: 2 sentences on the job itself — company, product, context — not the candidate)

CV:
<contents of data/cv/cv.txt>

Job offer:
Title: <offer title>
Location: <city>
Description: <normalized description, max 1000 chars>
```

> The description is pre-normalized by the time it reaches the prompt: HTML is stripped for Indeed offers, and France Travail offers include structured metadata (contract type, experience level, salary) prepended to the description text.

---

## Output schema

| Field           | Type           | Description                                             |
| --------------- | -------------- | ------------------------------------------------------- |
| `score`         | integer (1–10) | Overall match score                                     |
| `match_reasons` | string[]       | Positive signals (stack match, level, remote, etc.)     |
| `concerns`      | string[]       | Red flags or gaps (seniority, missing skills, etc.)     |
| `summary`       | string         | 2-sentence description of the job — not the candidate   |

Scores **≥ MIN_SCORE** (default: 7) trigger a Telegram notification. Lower scores are silently discarded.

---

## Tuning the prompt

Edit [n8n/code/prepare-request.js](../n8n/code/prepare-request.js), then run `npm run build` and restart the stack.

**To adjust the scoring rules**, edit the `Rules:` section of the prompt:

```text
- Penalize if required experience exceeds the candidate's by more than 2 years
- Prioritize remote policy above all else
```

**To adjust the recruiter persona**, edit the `system` array at the top of the file.

**To change the summary style**, update the instruction in the prompt:

```text
summary (string: one punchy sentence, max 15 words)
```

---

## Local LLM

Scoring runs entirely on-device via Ollama (native macOS, Metal GPU acceleration). No offer data or CV content is sent to an external API. `llama3.2:3b` is a good balance between speed (~30–60s per offer on Apple Silicon) and reasoning quality for structured JSON output. The `format: "json"` Ollama parameter enforces valid JSON output.
