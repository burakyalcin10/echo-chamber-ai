# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Echo Chamber AI** — an interactive artwork that visualizes 50 covers of Bob Dylan's "Knockin' on Heaven's Door" as a 3D emotional galaxy. Python FastAPI backend + Next.js/React Three.js frontend.

## Development Commands

### Backend (run from `backend/`)

```bash
# First-time setup
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in API keys

# Run API server
uvicorn main:app --reload --port 8000

# Tests
python -m pytest -q
python -m pytest tests/test_api_smoke.py -q   # single file

# Data pipeline (run sequentially after any data change)
python scripts/00_validate_covers.py
python scripts/01_build_covers.py
python scripts/02_score_covers.py [--dry-run] [--limit N] [--ids id1,id2]
python scripts/03_embed_and_umap.py [--dry-run]
python scripts/04_build_rag.py [--dry-run]
```

### Frontend (run from `frontend/`)

```bash
npm install
npm run dev    # dev server on :3000
npm run build
npm run lint
```

> **Next.js 16 warning**: This project uses Next.js 16, which has breaking changes from earlier versions. Before writing frontend code, consult `frontend/node_modules/next/dist/docs/` for current APIs and conventions.

## Architecture

### Data Flow

```
covers.json → LLM emotion scoring → embeddings → UMAP 3D coords
historical_docs/ → ChromaDB RAG index
         ↓
    FastAPI (port 8000)
         ↓
    Next.js (port 3000) — Three.js galaxy
```

All processed data lives in `backend/data/processed/` and is not committed to git.

### Backend Services (`backend/services/`)

| File | Role |
|------|------|
| `data_store.py` | Loads and caches cover data; central data source for all endpoints |
| `llm_client.py` | Unified Gemini/OpenAI provider abstraction — switch via `LLM_PROVIDER` env var |
| `embedding_matcher.py` | Semantic similarity search (all-MiniLM-L6-v2) for `/api/match` |
| `rag_store.py` | LlamaIndex + ChromaDB retrieval for `/api/voice` |
| `cover_validation.py` | Schema validation for pipeline scripts |

### API Endpoints (`backend/main.py`)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Status, provider config, data readiness |
| `GET /api/graph` | All 50 covers with 3D positions and emotion scores |
| `GET /api/cover/{cover_id}` | Full cover detail with emotional analysis |
| `POST /api/compare` | LLM comparative analysis between two covers |
| `POST /api/voice` | RAG-backed era monologue for a cover |
| `POST /api/match` | Semantic match of user farewell text → closest cover |

LLM-backed endpoints (`/api/compare`, `/api/voice`, `/api/match` bridge text) degrade to local generated text via `_generate_or_fallback` in `main.py` when:
- no key is configured, **or**
- the provider raises any error (incl. Gemini free-tier 429 quota / network).

`backend/config.py` honors `AIKNOCK_DISABLE_DOTENV=1` so tests/subprocesses can bypass the developer `.env` (used by `tests/test_scripts.py` to verify the "no key" path without leaking real keys).

### Frontend Structure (`frontend/`)

- `app/page.tsx` — root client component; owns all app state, mode transitions, and toast/error UX
- `components/graph/EchoMap.tsx` — Three.js galaxy (React Three Fiber); consumes `lib/relationships.ts`
- `components/graph/CoverNode.tsx` / `EdgeLine.tsx` / `UserSignalNode.tsx` — declarative R3F primitives
- `components/panels/` — DetailPanel (hero band + sonic signature + actions), EmotionMeter
- `components/dock/MatchDock.tsx` — user input for `/api/match` with inline error + source badges
- `components/layout/` — SideNav (mode switcher), TopBar (search · decade filter · relationship-mode selector · visible/total count)
- `lib/api.ts` — typed fetch wrappers; `lib/types.ts` mirrors `backend/schemas/api.py`
- `lib/relationships.ts` — **deterministic frontend-side edge engine**: 4 kinds (emotional / historical / genre / influence), capped per node, filterable by `RelationshipMode`. Edges are computed in the browser from `/api/graph` data — backend exposes only nodes.

Icons are via [`lucide-react`](https://lucide.dev) (typed React components). The Material Symbols font has been removed; do not reintroduce it.

App modes: `explore | match | compare | voice | archive`

### Type Contract

`backend/schemas/api.py` (Pydantic) and `frontend/lib/types.ts` (TypeScript) must stay in sync. See `docs/API_CONTRACT.md` for the full typed spec.

## Configuration

Backend `.env` keys:

```
LLM_PROVIDER=gemini          # or "openai"
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
EMBEDDING_MODEL=all-MiniLM-L6-v2
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000
```

## CI

GitHub Actions (`.github/workflows/backend-ci.yml`) runs on every push/PR: cover validation, script dry-runs, and `pytest` using Python 3.11. CI dependencies are in `backend/requirements-ci.txt`.
