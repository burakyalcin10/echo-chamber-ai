from pydantic import BaseModel, Field


class CompareRequest(BaseModel):
    cover_id_a: str
    cover_id_b: str


class VoiceRequest(BaseModel):
    cover_id: str


class MatchRequest(BaseModel):
    user_text: str = Field(..., min_length=1, max_length=3000)
