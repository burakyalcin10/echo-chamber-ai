# Deployment

This repo is set up for a free-tier split deployment:

- **Backend:** Render Web Service from `render.yaml`
- **Frontend:** Vercel Next.js project from `frontend/`

## Render backend

Create a new Render Blueprint from this GitHub repository. Render will read
`render.yaml` and create `echo-chamber-ai-api` on the free plan.

After the service is created, set secret environment variables in Render:

```env
GEMINI_API_KEY=...
OPENAI_API_KEY=...
```

`OPENAI_API_KEY` is optional. If only Gemini is configured, the API uses Gemini
and local fallback text where needed.

Confirm the backend is reading the keys by opening:

```text
https://YOUR_RENDER_BACKEND_URL/health
```

For generated AI commentary, `llm_configured` and `gemini_configured` should be
`true`. On the free Render profile, `semantic_match_available`,
`rag_retrieval_available`, and `umap_projection_available` can remain `false`
because the heavyweight local ML stack is intentionally not installed.

The backend URL will look like:

```text
https://echo-chamber-ai-api.onrender.com
```

Render free services may sleep after inactivity; the first request can be slow.

## Vercel frontend

Import the same GitHub repository in Vercel and set:

```text
Root Directory: frontend
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

Set this Vercel environment variable:

```env
NEXT_PUBLIC_API_URL=https://YOUR_RENDER_BACKEND_URL
```

Then deploy. The backend CORS config accepts Vercel preview/production domains
through `FRONTEND_ORIGIN_REGEX`.
