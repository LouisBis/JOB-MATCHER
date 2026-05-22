# Scoring Prompt

The scoring logic lives in the **Prepare Request** node of the n8n workflow. For each new offer, the prompt injects the candidate's CV and the offer description, then asks Mistral 7B to return a structured JSON score.

---

## Prompt template

```text
Score the following job offer against the candidate CV.
Return ONLY a valid JSON object — no markdown, no extra text:
{
  "score": <integer 1-10>,
  "match_reasons": ["reason1", ...],
  "concerns": ["concern1", ...],
  "summary": "2-line summary"
}

CV:
<contents of data/cv/cv.txt>

Job offer:
Title: <offer title>
Description: <offer description, HTML stripped>
```

---

## Output schema

| Field           | Type           | Description                                             |
| --------------- | -------------- | ------------------------------------------------------- |
| `score`         | integer (1–10) | Overall match score                                     |
| `match_reasons` | string[]       | Positive signals (stack match, level, remote, etc.)     |
| `concerns`      | string[]       | Red flags or gaps (seniority, missing skills, etc.)     |
| `summary`       | string         | 2-line plain-text summary, used in the Telegram message |

Scores **≥ MIN_SCORE** (default: 7) trigger a Telegram notification. Lower scores are silently discarded.

---

## Tuning the prompt

The prompt is the main lever for adjusting scoring behavior. Edit it in the **Prepare Request** Code node inside n8n.

**To weight specific criteria more heavily**, add explicit instructions:

```text
Prioritize stack match and remote policy above all else.
Penalize heavily if the required experience exceeds the candidate's by more than 2 years.
```

**To get more detailed reasons**, increase the expected array size:

```json
"match_reasons": ["reason1", "reason2", "reason3"],
```

**To change the summary style**, replace the description:

```json
"summary": "one punchy sentence, max 15 words"
```

---

## Why a local LLM

Scoring runs entirely on-device via Ollama (native macOS, Metal GPU acceleration). No offer data or CV content is sent to an external API. Mistral 7B is a good balance between speed and reasoning quality for this task (~5-10s per offer on Apple Silicon).
