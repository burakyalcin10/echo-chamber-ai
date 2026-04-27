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

## AI Techniques

Planned techniques:

- LLM-based musicological and historical interpretation using Gemini or OpenAI.
- Embedding-based semantic matching between user farewells and cover interpretations.
- UMAP dimensionality reduction for the 3D galaxy layout.
- RAG over historical documents for era voice generation.

## Repository Name

Working repository name: **echo-chamber-ai**.
