# Echo Chamber AI

Interactive AI artwork for the CSE 358 "KNOCK - Design Your Door" assignment.

Echo Chamber maps covers of Bob Dylan's "Knockin' on Heaven's Door" as a 3D emotional galaxy. The backend processes cover metadata, generates musicological interpretations with Gemini or OpenAI, prepares embedding/UMAP coordinates, and exposes the API used by the frontend experience.

## Deliverables

| Item | Location |
|------|----------|
| **Artwork** | This repository — run backend + frontend (see setup below) |
| **Artist's Manifesto** | [`MANIFESTO.md`](MANIFESTO.md) |
| **Code Repository** | This repo — see Architecture below |

## Project Structure

- `backend/` — FastAPI API server, data pipeline scripts, AI services
- `frontend/` — Next.js + React Three Fiber interactive galaxy
- `backend/data/covers.json` — 50-cover dataset with emotion scores
- `backend/data/historical_docs/` — RAG source documents (1973 era)
- `docs/` — API contract, backend runbook, data sources
- `MANIFESTO.md` — Artist's statement (1,750 words)

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

## Frontend Setup

The frontend requires the backend API to be running first (see **Backend Setup** above).

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### Environment variable

By default the frontend calls `http://localhost:8000`. To point at a different backend, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Key dependencies

| Package | Purpose |
|---------|---------|
| `next` 16 | App framework (has breaking changes — see `frontend/AGENTS.md`) |
| `react` / `react-dom` 19 | UI layer |
| `three` + `@react-three/fiber` | 3D galaxy renderer |
| `@react-three/drei` | R3F helpers (camera, labels, etc.) |
| `tailwindcss` v4 | Styling |

### Frontend scripts

```bash
npm run dev      # dev server on :3000 with hot reload
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
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

Three distinct generative AI techniques are deeply integrated:

| Technique | Role in the artwork |
|-----------|-------------------|
| **LLM Emotion Scoring** (Gemini / OpenAI) | Scores each cover on 6 emotional dimensions: surrender, defiance, grief, hope, exhaustion, transcendence. Produces `era_tension`, `political_charge`, `spiritual_weight`. |
| **Sentence Embeddings + UMAP** (`all-MiniLM-L6-v2`) | Converts cover metadata to semantic vectors; UMAP reduces to 3D galaxy coordinates. Powers the `/api/match` semantic search. |
| **RAG Pipeline** (LlamaIndex + ChromaDB) | Retrieves from 5 historical documents (Vietnam, 1973, Pat Garrett, Dylan) to ground the era voice monologue in real historical texture. |

All three techniques interact: LLM scores shape the embedding neighborhood structure, and the RAG voice is grounded in the same historical period that the embedding positions reflect.

All LLM-backed endpoints fall back to locally generated text when no API key is configured, so the artwork is fully explorable without credentials.

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

## Screenshots

**Galaxy overview** — 50 covers mapped as nodes in 3D emotional space, connected by four kinds of relationships (emotional proximity, historical era, genre affinity, influence chains).

![Galaxy overview](docs/screenshots/01_galaxy.png)

**Cover detail panel** — Selecting a cover (via click or Match mode) reveals its emotional profile across six dimensions, sonic signature, and a historical pulse grounding it in its era.

![Cover detail panel](docs/screenshots/02_cover_detail.png)

**Emotional edges** — Filter to a single relationship kind; here only emotional-proximity edges are shown, making the affinity clusters visible.

![Emotional edges](docs/screenshots/03_emotional_edges.png)

## Repository Name

Working repository name: **echo-chamber-ai**.
