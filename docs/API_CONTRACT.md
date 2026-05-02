# Echo Chamber API Contract

Base URL:

```text
http://localhost:8000
```

All endpoints use JSON. LLM-backed endpoints are demo-safe: if Gemini/OpenAI is not configured, they return local fallback text and include a `*_source` field.

## `GET /health`

Response:

```json
{
  "status": "ok",
  "app": "Echo Chamber API",
  "environment": "development",
  "llm_provider": "gemini",
  "llm_configured": false,
  "raw_covers_exists": true,
  "processed_covers_exists": true,
  "raw_cover_count": 32,
  "processed_cover_count": 32,
  "processed_data_stale": false
}
```

## `GET /api/graph`

Used by the Three.js galaxy on initial load.

Response:

```json
{
  "covers": [
    {
      "id": "dylan_1973",
      "artist": "Bob Dylan",
      "year": 1973,
      "position": { "x": 7.495, "y": 5.76, "z": 3.855 },
      "emotion_scores": {
        "surrender": 0.92,
        "defiance": 0.18,
        "grief": 0.72,
        "hope": 0.28,
        "exhaustion": 0.86,
        "transcendence": 0.55
      },
      "era_tension": 0.82,
      "political_charge": 0.66,
      "is_original": true
    }
  ]
}
```

Notes:

- `position.x/y/z` are normalized scene coordinates in roughly `[-8, 8]`.
- `embedding_vector` is intentionally excluded from this endpoint.

## `GET /api/cover/{cover_id}`

Used by the selected cover detail panel.

Response:

```json
{
  "id": "dylan_1973",
  "artist": "Bob Dylan",
  "year": 1973,
  "album": "Pat Garrett & Billy the Kid",
  "genre": "folk rock",
  "is_original": true,
  "context_notes": "Written for Sam Peckinpah's Western...",
  "position": { "x": 7.495, "y": 5.76, "z": 3.855 },
  "emotion_scores": {
    "surrender": 0.92,
    "defiance": 0.18,
    "grief": 0.72,
    "hope": 0.28,
    "exhaustion": 0.86,
    "transcendence": 0.55
  },
  "meaning_shift": "surrender, mortality, exhausted farewell",
  "historical_pulse": "Written for Sam Peckinpah's Western...",
  "era_tension": 0.82,
  "political_charge": 0.66,
  "spiritual_weight": 0.84
}
```

Errors:

- `404` for unknown `cover_id`.

## `POST /api/compare`

Used by comparison mode after two covers are selected.

Request:

```json
{
  "cover_id_a": "dylan_1973",
  "cover_id_b": "gnr_1990"
}
```

Response:

```json
{
  "analysis": "Between Bob Dylan in 1973 and Guns N' Roses in 1990...",
  "analysis_source": "local_fallback",
  "shift_direction": "surrender->defiance",
  "key_year_a": 1973,
  "key_year_b": 1990,
  "historical_context_a": "Written for Sam Peckinpah's Western...",
  "historical_context_b": "The song is amplified into hard rock spectacle..."
}
```

Notes:

- `analysis_source` is either `llm` or `local_fallback`.
- Frontend should display `analysis` regardless of source.

Errors:

- `400` when both ids are the same.
- `404` for unknown cover ids.

## `POST /api/voice`

Used by the era voice modal/panel.

Request:

```json
{
  "cover_id": "dylan_1973"
}
```

Response:

```json
{
  "monologue": "I am 1973, speaking through Bob Dylan's version...",
  "monologue_source": "local_fallback",
  "year": 1973,
  "artist": "Bob Dylan",
  "rag_sources_used": []
}
```

Notes:

- `monologue_source` is either `llm` or `local_fallback`.
- `rag_sources_used` is empty until `backend/data/historical_docs/` has been indexed with `scripts/04_build_rag.py`.

## `POST /api/match`

Used by the "find your door" farewell input.

Request:

```json
{
  "user_text": "I am tired and saying goodbye to an old life."
}
```

Response:

```json
{
  "matched_cover": {
    "id": "gnr_1990",
    "artist": "Guns N' Roses",
    "year": 1990
  },
  "similarity_score": 0.3756,
  "bridge_text": "Your farewell lands closest to the 1990 Guns N' Roses version...",
  "user_position": { "x": 8.0, "y": -2.007, "z": 7.172 },
  "match_method": "embedding",
  "bridge_source": "local_fallback"
}
```

Notes:

- `match_method` is `embedding` when processed embeddings exist, otherwise `keyword_fallback`.
- `bridge_source` is either `llm` or `local_fallback`.
- `similarity_score` is cosine similarity for embedding mode and an approximate score for fallback mode.

Errors:

- `400` for empty `user_text`.
