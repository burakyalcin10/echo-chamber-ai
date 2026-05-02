import json
import math
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from config import get_settings


def _read_json(path: Path) -> list[dict[str, Any]]:
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=f"Data file not found: {path.name}") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Invalid JSON data file: {path.name}") from exc

    if not isinstance(data, list):
        raise HTTPException(status_code=500, detail=f"Expected a list in {path.name}")
    return data


def load_covers(prefer_processed: bool = True) -> list[dict[str, Any]]:
    settings = get_settings()
    if prefer_processed and settings.processed_covers_path.exists():
        processed = _read_json(settings.processed_covers_path)
        raw = _read_json(settings.raw_covers_path)
        covers = _merge_raw_metadata(processed, raw) if len(processed) == len(raw) else raw
    else:
        covers = _read_json(settings.raw_covers_path)

    return [_with_fallback_position(cover, index, len(covers)) for index, cover in enumerate(covers)]


def _merge_raw_metadata(processed: list[dict[str, Any]], raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
    raw_by_id = {cover.get("id"): cover for cover in raw}
    passthrough_fields = ("artist_image_url",)
    merged: list[dict[str, Any]] = []

    for cover in processed:
        enriched = dict(cover)
        raw_cover = raw_by_id.get(cover.get("id"), {})
        for field in passthrough_fields:
            if raw_cover.get(field) and not enriched.get(field):
                enriched[field] = raw_cover[field]
        merged.append(enriched)

    return merged


def cover_counts() -> dict[str, int | bool]:
    settings = get_settings()
    raw_count = len(_read_json(settings.raw_covers_path)) if settings.raw_covers_path.exists() else 0
    processed_count = len(_read_json(settings.processed_covers_path)) if settings.processed_covers_path.exists() else 0
    return {
        "raw_cover_count": raw_count,
        "processed_cover_count": processed_count,
        "processed_data_stale": bool(processed_count and processed_count != raw_count),
    }


def get_cover_or_404(cover_id: str) -> dict[str, Any]:
    for cover in load_covers(prefer_processed=True):
        if cover.get("id") == cover_id:
            return cover
    raise HTTPException(status_code=404, detail=f"Unknown cover id: {cover_id}")


def _with_fallback_position(cover: dict[str, Any], index: int, total: int) -> dict[str, Any]:
    if "position" in cover and isinstance(cover["position"], dict):
        return cover

    angle = (index / max(total, 1)) * math.tau
    radius = 4.0 + (index % 5) * 0.85
    year = int(cover.get("year", 1973))
    y = ((year - 1973) / 55.0) * 12.0 - 6.0

    enriched = dict(cover)
    enriched["position"] = {
        "x": round(math.cos(angle) * radius, 3),
        "y": round(max(min(y, 8.0), -8.0), 3),
        "z": round(math.sin(angle) * radius, 3),
    }
    return enriched


def graph_cover_payload(cover: dict[str, Any]) -> dict[str, Any]:
    analysis = cover.get("llm_analysis") or {}
    return {
        "id": cover["id"],
        "artist": cover["artist"],
        "year": cover["year"],
        "position": cover["position"],
        "emotion_scores": analysis.get("emotion_scores", cover.get("emotion_scores", {})),
        "era_tension": analysis.get("era_tension", cover.get("era_tension", 0.5)),
        "political_charge": analysis.get("political_charge", cover.get("political_charge", 0.5)),
        "is_original": cover.get("is_original", False),
        "genre": cover.get("genre"),
        "artist_image_url": cover.get("artist_image_url"),
    }


def cover_detail_payload(cover: dict[str, Any]) -> dict[str, Any]:
    analysis = cover.get("llm_analysis") or {}
    return {
        "id": cover["id"],
        "artist": cover["artist"],
        "year": cover["year"],
        "album": cover.get("album"),
        "genre": cover.get("genre"),
        "is_original": cover.get("is_original", False),
        "context_notes": cover.get("context_notes", ""),
        "position": cover["position"],
        "emotion_scores": analysis.get("emotion_scores", cover.get("emotion_scores", {})),
        "meaning_shift": analysis.get("meaning_shift", cover.get("mood_hint", "")),
        "historical_pulse": analysis.get("historical_pulse", cover.get("context_notes", "")),
        "era_tension": analysis.get("era_tension", cover.get("era_tension", 0.5)),
        "political_charge": analysis.get("political_charge", cover.get("political_charge", 0.5)),
        "spiritual_weight": analysis.get("spiritual_weight", cover.get("spiritual_weight", 0.5)),
        "artist_image_url": cover.get("artist_image_url"),
    }
