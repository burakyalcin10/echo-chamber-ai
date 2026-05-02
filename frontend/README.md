# Echo Chamber — Frontend

Interactive web client for **Echo Chamber AI**: a 3D archive of 32 verified covers of
Bob Dylan's *Knockin' on Heaven's Door*, where users explore the song's
emotional/historical relationships and match their own farewell to a cover.

This is a **Next.js 16 (Turbopack) + React 19 + Tailwind v4 + React Three
Fiber** app. It talks to the FastAPI backend in `../backend/`.

> ⚠️ Next.js 16 has breaking changes from earlier versions. Before editing
> framework code, consult `node_modules/next/dist/docs/`. See `AGENTS.md`.

---

## Getting started

The backend must be running first (see the root `README.md`):

```bash
# from project root
cd backend
uvicorn main:app --reload --port 8000
```

Then start the frontend:

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

### Env vars

By default the client points at `http://localhost:8000`. Override with
`frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Scripts

```bash
npm run dev      # dev server (Turbopack) on :3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```

---

## User journey

1. The 3D **Echo Map** loads 32 verified cover nodes from `GET /api/graph`,
   using artist portrait URLs when available.
2. Click a node → right-side **DetailPanel** opens
   (`GET /api/cover/{id}`): hero band, meaning shift, emotional profile,
   sonic signature, historical pulse.
3. **Compare** in the detail panel → pick a second cover →
   `POST /api/compare` overlay (analysis, shift direction, source badge).
4. **Era Voice** in the detail panel → `POST /api/voice` overlay
   (RAG-backed monologue + RAG-source chips).
5. Bottom **MatchDock** → user types a farewell →
   `POST /api/match` highlights the matched cover, drops a *User Signal*
   node, draws a dusty-blue edge, and auto-opens the matched cover.

If the backend is unreachable, the canvas renders a clear "The galaxy is
silent" state with a retry button.

---

## Architecture

```
app/
  layout.tsx          html shell, film-grain overlay
  page.tsx            top-level state machine + overlays
  globals.css         design tokens (Archival Minimalism)

components/
  layout/
    SideNav.tsx       Explore / Match / Compare / Era Voice / Archive
    TopBar.tsx        page title · search · decade filter ·
                      relationship-mode selector · result count
  graph/
    EchoMap.tsx       R3F canvas, edges, legend
    CoverNode.tsx     individual node with optional artist portrait
    EdgeLine.tsx      relationship edge (dashed for emotional)
    UserSignalNode.tsx  pulsing tertiary node placed by /api/match
  panels/
    DetailPanel.tsx   right rail (empty state, hero band, sonic signature)
    EmotionMeter.tsx  single emotion bar
  dock/
    MatchDock.tsx     bottom farewell input + match result + error inline

lib/
  api.ts              typed fetch wrappers for /health and /api/*
  types.ts            mirrors backend/schemas/api.py
  constants.ts        emotion labels/colors, decades
  relationships.ts    deterministic edge engine — see below
```

### Relationship engine (`lib/relationships.ts`)

Edges are computed entirely on the frontend from `GET /api/graph` data,
so the backend stays a thin source of truth.

Four edge kinds:

| Kind         | Rule                                                        | Color  |
|--------------|-------------------------------------------------------------|--------|
| Emotional    | 1 − euclidean distance over 6 emotion scores                | amber  |
| Historical   | year proximity, ≤ 10 years apart                            | ivory  |
| Genre        | token overlap on `genre`                                    | rust   |
| Influence    | era-tension/political-charge proximity, plus a soft pull from every cover back to the Dylan origin | gold |

Per-node edge cap (default **3 per kind**) prevents clutter; strength
drives opacity. The **TopBar relationship-mode selector** filters edges
to a single kind or shows All.

### State machine

`app/page.tsx` owns the modes:

```
explore  ─▶ select cover    ─▶ explore (cover open)
                                │
                                ├─▶ compare  ─▶ pick second  ─▶ result
                                ├─▶ voice
                                └─▶ match (also reachable from MatchDock)
```

Errors from `/api/match`, `/api/voice`, `/api/compare` surface as
top-right toasts; the match dock additionally inlines the error so the
input keeps focus.

---

## Design system

Tokens are declared in `app/globals.css` under `@theme`. Major palette:

- `--color-primary` `#e9c176` — amber accent
- `--color-secondary-container` `#7b3224` — rust
- `--color-tertiary` `#b5cad4` — dusty blue (user signal)
- `--color-canvas` `#0a0a0a` — graph backdrop

Typography pairs **Newsreader** (serif, editorial) with **Inter**
(sans, technical). Icons are from
[`lucide-react`](https://lucide.dev) — a typed React icon set, replacing
the previous Material Symbols font.

---

## Type contract

`frontend/lib/types.ts` mirrors `backend/schemas/api.py`. When the
backend contract changes, update both. The full typed spec also lives
in `docs/API_CONTRACT.md` at the repo root.
