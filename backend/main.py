from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from schemas.api import CompareRequest, MatchRequest, VoiceRequest
from services.data_store import cover_detail_payload, get_cover_or_404, graph_cover_payload, load_covers
from services.embedding_matcher import match_user_text
from services.llm_client import get_llm_client


settings = get_settings()

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "llm_provider": settings.llm_provider,
        "llm_configured": get_llm_client().is_configured(),
        "raw_covers_exists": settings.raw_covers_path.exists(),
        "processed_covers_exists": settings.processed_covers_path.exists(),
    }


@app.get("/api/graph")
async def get_graph() -> dict:
    covers = load_covers(prefer_processed=True)
    return {"covers": [graph_cover_payload(cover) for cover in covers]}


@app.get("/api/cover/{cover_id}")
async def get_cover(cover_id: str) -> dict:
    return cover_detail_payload(get_cover_or_404(cover_id))


@app.post("/api/compare")
async def compare_covers(request: CompareRequest) -> dict:
    if request.cover_id_a == request.cover_id_b:
        raise HTTPException(status_code=400, detail="Choose two different covers.")

    cover_a = cover_detail_payload(get_cover_or_404(request.cover_id_a))
    cover_b = cover_detail_payload(get_cover_or_404(request.cover_id_b))

    prompt = f"""
You are a cultural critic and musicologist analyzing two covers of "Knockin' on Heaven's Door".

Cover A: {cover_a['artist']} ({cover_a['year']})
Analysis: {cover_a['meaning_shift']}
Historical context: {cover_a['historical_pulse']}

Cover B: {cover_b['artist']} ({cover_b['year']})
Analysis: {cover_b['meaning_shift']}
Historical context: {cover_b['historical_pulse']}

Write 2-3 paragraphs examining the meaning shift between these two covers.
Be specific, poetic, and historically grounded. Language: English.
""".strip()
    analysis = get_llm_client().generate_text(prompt, temperature=0.75)

    return {
        "analysis": analysis,
        "shift_direction": _shift_direction(cover_a, cover_b),
        "key_year_a": cover_a["year"],
        "key_year_b": cover_b["year"],
        "historical_context_a": cover_a["historical_pulse"],
        "historical_context_b": cover_b["historical_pulse"],
    }


@app.post("/api/voice")
async def era_voice(request: VoiceRequest) -> dict:
    cover = cover_detail_payload(get_cover_or_404(request.cover_id))
    prompt = f"""
You are a literary AI channeling the internal voice of an era.

The year is {cover['year']}. {cover['artist']} has recorded "Knockin' on Heaven's Door".

Historical context:
{cover['historical_pulse']}

Write a 150-word first-person interior monologue as if you are the era itself speaking
through this recording. Use sensory details. Reference real historical events.
Be poetic but grounded. Do not explain; evoke.
""".strip()
    monologue = get_llm_client().generate_text(prompt, temperature=0.8)
    return {
        "monologue": monologue,
        "year": cover["year"],
        "artist": cover["artist"],
        "rag_sources_used": [],
    }


@app.post("/api/match")
async def match_farewell(request: MatchRequest) -> dict:
    user_text = request.user_text.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="user_text cannot be empty.")

    covers = load_covers(prefer_processed=True)
    matched, similarity_score, user_position = match_user_text(user_text, covers)
    detail = cover_detail_payload(matched)
    prompt = f"""
A user wrote this farewell:
"{user_text}"

They have been matched to {detail['artist']}'s {detail['year']} cover of "Knockin' on Heaven's Door".
This cover's essence: {detail['meaning_shift']}
Historical context: {detail['historical_pulse']}

Write 3 sentences connecting their personal farewell to this cover and its era.
Be empathetic, literary, and specific. Do not be generic.
""".strip()
    bridge_text = get_llm_client().generate_text(prompt, temperature=0.7)

    return {
        "matched_cover": {
            "id": detail["id"],
            "artist": detail["artist"],
            "year": detail["year"],
        },
        "similarity_score": similarity_score,
        "bridge_text": bridge_text,
        "user_position": user_position,
    }


def _shift_direction(cover_a: dict, cover_b: dict) -> str:
    scores_a = cover_a.get("emotion_scores") or {}
    scores_b = cover_b.get("emotion_scores") or {}
    if not scores_a or not scores_b:
        return "contextual shift"
    strongest_a = max(scores_a, key=scores_a.get)
    strongest_b = max(scores_b, key=scores_b.get)
    return f"{strongest_a}->{strongest_b}"

