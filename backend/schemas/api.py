from typing import Literal

from pydantic import BaseModel, Field


class CompareRequest(BaseModel):
    cover_id_a: str
    cover_id_b: str


class VoiceRequest(BaseModel):
    cover_id: str


class MatchRequest(BaseModel):
    user_text: str = Field(..., min_length=1, max_length=3000)


class HealthResponse(BaseModel):
    status: str
    app: str
    environment: str
    llm_provider: str
    llm_configured: bool
    raw_covers_exists: bool
    processed_covers_exists: bool
    raw_cover_count: int
    processed_cover_count: int


class Position(BaseModel):
    x: float
    y: float
    z: float


class EmotionScores(BaseModel):
    surrender: float
    defiance: float
    grief: float
    hope: float
    exhaustion: float
    transcendence: float


class GraphCover(BaseModel):
    id: str
    artist: str
    year: int
    position: Position
    emotion_scores: EmotionScores
    era_tension: float
    political_charge: float
    is_original: bool


class GraphResponse(BaseModel):
    covers: list[GraphCover]


class CoverDetailResponse(BaseModel):
    id: str
    artist: str
    year: int
    album: str | None = None
    genre: str | None = None
    is_original: bool
    context_notes: str
    position: Position
    emotion_scores: EmotionScores
    meaning_shift: str
    historical_pulse: str
    era_tension: float
    political_charge: float
    spiritual_weight: float


class CompareResponse(BaseModel):
    analysis: str
    analysis_source: Literal["llm", "local_fallback"]
    shift_direction: str
    key_year_a: int
    key_year_b: int
    historical_context_a: str
    historical_context_b: str


class VoiceResponse(BaseModel):
    monologue: str
    monologue_source: Literal["llm", "local_fallback"]
    year: int
    artist: str
    rag_sources_used: list[str]


class MatchedCover(BaseModel):
    id: str
    artist: str
    year: int


class MatchResponse(BaseModel):
    matched_cover: MatchedCover
    similarity_score: float
    bridge_text: str
    user_position: Position
    match_method: Literal["embedding", "keyword_fallback"]
    bridge_source: Literal["llm", "local_fallback"]
