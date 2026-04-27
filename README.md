# Echo Chamber AI

Interactive AI artwork for the CSE 358 "KNOCK - Design Your Door" assignment.

Echo Chamber maps covers of Bob Dylan's "Knockin' on Heaven's Door" as a 3D emotional galaxy. The backend processes cover metadata, generates musicological interpretations with Gemini or OpenAI, prepares embedding/UMAP coordinates, and exposes the API used by the frontend experience.

## Current Status

- Project planning and kanban are in `PROJECT_KANBAN_BACKLOG.md`.
- Backend scaffold is in `backend/`.
- Initial cover dataset is in `backend/data/covers.json`.
- RAG source preparation guide is in `docs/RAG_PREP_GUIDE.md`.

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

1. Score the cover metadata with the configured provider:

```bash
python scripts/02_score_covers.py
```

2. Build semantic embeddings and 3D UMAP positions:

```bash
python scripts/03_embed_and_umap.py
```

3. After historical documents are added under `backend/data/historical_docs/`, build the local RAG index:

```bash
python scripts/04_build_rag.py
```

Then restart the API.

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
