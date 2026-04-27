# Echo Chamber AI

Interactive AI artwork for the CSE 358 "KNOCK - Design Your Door" assignment.

Echo Chamber maps covers of Bob Dylan's "Knockin' on Heaven's Door" as a 3D emotional galaxy. The backend processes cover metadata, generates musicological interpretations with Gemini or OpenAI, prepares embedding/UMAP coordinates, and exposes the API used by the frontend experience.

## Current Status

- Project planning and kanban are in `PROJECT_KANBAN_BACKLOG.md`.
- Backend scaffold is in `backend/`.
- 50-cover dataset is in `backend/data/covers.json`.
- Starter RAG historical documents are in `backend/data/historical_docs/`.
- RAG source preparation guide is in `docs/RAG_PREP_GUIDE.md`.
- Data/source attribution notes are in `docs/DATA_SOURCES.md`.
- Backend runbook is in `docs/BACKEND_RUNBOOK.md`.

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set either Gemini or OpenAI credentials in `backend/.env`:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

or:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

Run the API:

```bash
uvicorn main:app --reload --port 8000
```

Useful first checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/graph
curl http://localhost:8000/api/cover/dylan_1973
```

## Backend Pipeline

Run these from `backend/`.

0. Validate the cover metadata:

```bash
python scripts/00_validate_covers.py
python scripts/01_build_covers.py
```

1. Score the cover metadata with the configured provider:

```bash
python scripts/02_score_covers.py
```

Useful scoring options:

```bash
# Validate input and see which covers would be scored without calling an API.
python scripts/02_score_covers.py --dry-run --limit 5

# Score only selected covers.
python scripts/02_score_covers.py --ids dylan_1973,clapton_1975

# Retry transient provider/rate-limit failures and keep going after one cover fails.
python scripts/02_score_covers.py --retries 3 --continue-on-error

# Rescore covers that already have llm_analysis.
python scripts/02_score_covers.py --force
```

The scorer writes after each successful cover and keeps a local cache under `backend/data/processed/score_cache.json`, so interrupted runs can resume without repeating successful paid calls.

2. Build semantic embeddings and 3D UMAP positions:

```bash
python scripts/03_embed_and_umap.py
```

3. After historical documents are added under `backend/data/historical_docs/`, build the local RAG index:

```bash
python scripts/00_validate_rag_docs.py
python scripts/04_build_rag.py --dry-run
python scripts/04_build_rag.py
```

Then restart the API.

## Tests

Run backend tests from `backend/`:

```bash
python -m pytest -q
```

Fast script checks without API/model calls:

```bash
python scripts/00_validate_covers.py
python scripts/01_build_covers.py
python scripts/02_score_covers.py --dry-run --limit 5
python scripts/03_embed_and_umap.py --dry-run
python scripts/04_build_rag.py --dry-run
```

Generated files under `backend/data/processed/` are local artifacts and are not committed.

GitHub Actions runs the lightweight backend CI workflow on pushes and pull requests using:

```text
.github/workflows/backend-ci.yml
backend/requirements-ci.txt
```

## API Overview

Base URL:

```text
http://localhost:8000
```

Endpoints:

- `GET /health`
- `GET /api/graph`
- `GET /api/cover/{cover_id}`
- `POST /api/compare`
- `POST /api/voice`
- `POST /api/match`

LLM-backed endpoints require either `GEMINI_API_KEY` or `OPENAI_API_KEY`.

The frontend-facing contract is documented in:

```text
docs/API_CONTRACT.md
```

FastAPI also exposes typed OpenAPI docs while the server is running:

```text
http://localhost:8000/docs
http://localhost:8000/openapi.json
```

## AI Techniques

Planned techniques:

- LLM-based musicological and historical interpretation using Gemini or OpenAI.
- Embedding-based semantic matching between user farewells and cover interpretations.
- UMAP dimensionality reduction for the 3D galaxy layout.
- RAG over historical documents for era voice generation.

## RAG Source Work

The source prep guide is here:

```text
docs/RAG_PREP_GUIDE.md
```

Minimum documents:

- `1973_world_events.txt`
- `vietnam_and_returning_soldiers.txt`
- `pat_garrett_film_context.txt`
- `counterculture_and_dylan_1970s.txt`
- `dylan_nobel_and_songwriting.txt`

## Repository Name

Working repository name: **echo-chamber-ai**.
