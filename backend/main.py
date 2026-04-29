from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from collections.abc import Callable

from config import get_settings
from schemas.api import (
    CompareRequest,
    CompareResponse,
    CoverDetailResponse,
    GraphResponse,
    HealthResponse,
    MatchRequest,
    MatchResponse,
    VoiceRequest,
    VoiceResponse,
)
from services.data_store import cover_counts, cover_detail_payload, get_cover_or_404, graph_cover_payload, load_covers
from services.embedding_matcher import match_user_text
from services.llm_client import get_llm_client
from services.rag_store import retrieve_historical_context


settings = get_settings()

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> dict:
    counts = cover_counts()
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "llm_provider": settings.llm_provider,
        "llm_configured": get_llm_client().is_configured(),
        "raw_covers_exists": settings.raw_covers_path.exists(),
        "processed_covers_exists": settings.processed_covers_path.exists(),
        **counts,
    }


@app.get("/api/graph", response_model=GraphResponse)
async def get_graph() -> dict:
    covers = load_covers(prefer_processed=True)
    return {"covers": [graph_cover_payload(cover) for cover in covers]}


@app.get("/api/cover/{cover_id}", response_model=CoverDetailResponse)
async def get_cover(cover_id: str) -> dict:
    return cover_detail_payload(get_cover_or_404(cover_id))


@app.post("/api/compare", response_model=CompareResponse)
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
    analysis, analysis_source = _generate_or_fallback(
        prompt,
        fallback=lambda: _fallback_compare_text(cover_a, cover_b),
        temperature=0.75,
    )

    return {
        "analysis": analysis,
        "analysis_source": analysis_source,
        "shift_direction": _shift_direction(cover_a, cover_b),
        "key_year_a": cover_a["year"],
        "key_year_b": cover_b["year"],
        "historical_context_a": cover_a["historical_pulse"],
        "historical_context_b": cover_b["historical_pulse"],
    }


@app.post("/api/voice", response_model=VoiceResponse)
async def era_voice(request: VoiceRequest) -> dict:
    cover = cover_detail_payload(get_cover_or_404(request.cover_id))
    rag_context, sources = retrieve_historical_context(
        f"What was happening culturally and politically around {cover['year']} "
        f"for {cover['artist']} and Knockin' on Heaven's Door?"
    )
    historical_context = rag_context or cover["historical_pulse"]
    prompt = f"""
You are a literary AI channeling the internal voice of an era.

The year is {cover['year']}. {cover['artist']} has recorded "Knockin' on Heaven's Door".

Historical context from the archive:
{historical_context}

Write a 150-word first-person interior monologue as if you are the era itself speaking
through this recording. Use sensory details. Reference real historical events.
Be poetic but grounded. Do not explain; evoke.
""".strip()
    monologue, monologue_source = _generate_or_fallback(
        prompt,
        fallback=lambda: _fallback_voice_text(cover, historical_context),
        temperature=0.8,
    )
    return {
        "monologue": monologue,
        "monologue_source": monologue_source,
        "year": cover["year"],
        "artist": cover["artist"],
        "rag_sources_used": sources,
    }


@app.post("/api/match", response_model=MatchResponse)
async def match_farewell(request: MatchRequest) -> dict:
    user_text = request.user_text.strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="user_text cannot be empty.")

    covers = load_covers(prefer_processed=True)
    match = match_user_text(user_text, covers)
    matched = match["cover"]
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
    bridge_text, bridge_source = _generate_or_fallback(
        prompt,
        fallback=lambda: _fallback_bridge_text(detail),
        temperature=0.7,
    )

    return {
        "matched_cover": {
            "id": detail["id"],
            "artist": detail["artist"],
            "year": detail["year"],
        },
        "similarity_score": match["similarity_score"],
        "bridge_text": bridge_text,
        "user_position": match["user_position"],
        "match_method": match["match_method"],
        "bridge_source": bridge_source,
    }


def _shift_direction(cover_a: dict, cover_b: dict) -> str:
    scores_a = cover_a.get("emotion_scores") or {}
    scores_b = cover_b.get("emotion_scores") or {}
    if not scores_a or not scores_b:
        return "contextual shift"
    strongest_a = max(scores_a, key=scores_a.get)
    strongest_b = max(scores_b, key=scores_b.get)
    return f"{strongest_a}->{strongest_b}"


def _generate_or_fallback(prompt: str, *, fallback: Callable[[], str], temperature: float) -> tuple[str, str]:
    llm = get_llm_client()
    if not llm.is_configured():
        return fallback(), "local_fallback"
    try:
        return llm.generate_text(prompt, temperature=temperature), "llm"
    except HTTPException:
        return fallback(), "local_fallback"
    except Exception:
        # Provider quota / network / unexpected SDK errors should not 500 the
        # request — degrade to the local fallback so the app stays usable.
        return fallback(), "local_fallback"


def _fallback_compare_text(cover_a: dict, cover_b: dict) -> str:
    direction = _shift_direction(cover_a, cover_b).replace("->", " to ")
    meaning_a = _ensure_sentence(cover_a["meaning_shift"].lower())
    meaning_b = _ensure_sentence(cover_b["meaning_shift"].lower())
    pulse_a = _ensure_sentence(cover_a["historical_pulse"])
    pulse_b = _ensure_sentence(cover_b["historical_pulse"])
    return (
        f"Between {cover_a['artist']} in {cover_a['year']} and {cover_b['artist']} in {cover_b['year']}, "
        f"the first recording carries {meaning_a} The later one turns toward {meaning_b} "
        f"The emotional vector bends {direction}, carrying the farewell out of one historical pressure "
        "and into another.\n\n"
        f"The first version is rooted in this pulse: {pulse_a} "
        f"The later version answers with its own weather: {pulse_b} "
        "This local analysis keeps the comparison panel usable until a Gemini or OpenAI key is configured."
    )


def _fallback_voice_text(cover: dict, historical_context: str) -> str:
    meaning = _ensure_sentence(cover["meaning_shift"].lower())
    context = _ensure_sentence(_compact_context(historical_context) or cover["historical_pulse"])
    return (
        f"I am {cover['year']}, speaking through {cover['artist']}'s version of the song. "
        f"I carry {meaning} "
        f"Around me: {context} "
        "The door is not only an ending; it is the place where a culture hears what it can no longer carry."
    )


def _fallback_bridge_text(cover: dict) -> str:
    meaning = _ensure_sentence(cover["meaning_shift"].lower())
    pulse = _ensure_sentence(cover["historical_pulse"].lower())
    return (
        f"Your farewell lands closest to the {cover['year']} {cover['artist']} version. "
        f"That recording turns the song toward {meaning} "
        f"Its historical pulse is {pulse}"
    )


def _compact_context(text: str, *, limit: int = 300) -> str:
    cleaned_lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("[") or stripped.startswith("Title:"):
            continue
        cleaned_lines.append(stripped)
    cleaned = " ".join(cleaned_lines)
    cleaned = " ".join(cleaned.split())
    sentences = [
        sentence.strip()
        for sentence in cleaned.split(".")
        if sentence.strip() and sentence.strip()[0].isupper()
    ]
    if sentences:
        selected: list[str] = []
        total = 0
        for sentence in sentences:
            addition = len(sentence) + (2 if selected else 0)
            if selected and total + addition > limit:
                break
            selected.append(sentence)
            total += addition
        return ". ".join(selected)
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[:limit].rsplit(" ", 1)[0] + "."


def _ensure_sentence(text: str) -> str:
    stripped = text.strip()
    if not stripped:
        return stripped
    return stripped if stripped[-1] in ".!?" else f"{stripped}."
