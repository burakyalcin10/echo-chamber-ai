# Backend Runbook

This is the backend operating checklist for Echo Chamber.

## Current Backend Status

Backend is demo-ready without external API keys.

Working locally:

- `GET /health`
- `GET /api/graph`
- `GET /api/cover/{cover_id}`
- `POST /api/compare`
- `POST /api/voice`
- `POST /api/match`
- 32 verified-cover dataset
- Local fallback text for LLM-backed endpoints
- Embedding/UMAP processing pipeline
- RAG document validation and indexing pipeline
- Typed FastAPI OpenAPI contract
- GitHub Actions backend CI

Still requiring external input for final AI quality:

- Gemini key for cover scoring, compare, match bridge text, and Era Voice when `LLM_PROVIDER=gemini`
- Optional OpenAI key if you want Compare and Era Voice to prefer OpenAI when available
- Optional human review of the 32 verified cover metadata and RAG wording

## Fresh Setup

Run from the repository root:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
```

For the current setup, Gemini alone is enough:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Optionally add OpenAI as a secondary provider. Compare and Era Voice prefer OpenAI when this key exists; otherwise they use Gemini:

```env
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Alternatively, set OpenAI as the default provider:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

## Fast Checks

```bash
python scripts/00_validate_covers.py
python scripts/01_build_covers.py
python scripts/00_validate_rag_docs.py
python scripts/02_score_covers.py --dry-run --limit 5
python scripts/03_embed_and_umap.py --dry-run
python scripts/04_build_rag.py --dry-run
python -m pytest -q
```

## Full Local Data Pipeline

Without API keys, skip step 2 and use the manual starter scores already in `covers.json`.

```bash
python scripts/00_validate_covers.py
python scripts/01_build_covers.py
python scripts/02_score_covers.py --limit 5
python scripts/02_score_covers.py
python scripts/03_embed_and_umap.py
python scripts/00_validate_rag_docs.py
python scripts/04_build_rag.py
```

## Run API

```bash
uvicorn main:app --reload --port 8000
```

Open:

```text
http://localhost:8000/health
http://localhost:8000/docs
```

Smoke calls:

```bash
curl http://localhost:8000/api/graph
curl http://localhost:8000/api/cover/dylan_1973
```

PowerShell POST checks:

```powershell
Invoke-RestMethod http://localhost:8000/api/compare -Method Post -ContentType "application/json" -Body '{"cover_id_a":"dylan_1973","cover_id_b":"gnr_1990"}'
Invoke-RestMethod http://localhost:8000/api/voice -Method Post -ContentType "application/json" -Body '{"cover_id":"dylan_1973"}'
Invoke-RestMethod http://localhost:8000/api/match -Method Post -ContentType "application/json" -Body '{"user_text":"I am tired and saying goodbye to an old life."}'
```

## Expected Health

After running embedding and RAG builds:

```json
{
  "status": "ok",
  "raw_cover_count": 32,
  "processed_cover_count": 32,
  "processed_data_stale": false
}
```

If `processed_data_stale` is `true`, run:

```bash
python scripts/03_embed_and_umap.py
```

## Final Submission Notes

- Generated files under `backend/data/processed/` are local artifacts and are not committed.
- API keys must not be committed.
- LLM-generated fields should be reviewed before final exhibition demo.
- `docs/API_CONTRACT.md` is the frontend contract.
- `PROJECT_KANBAN_BACKLOG.md` tracks project status.
