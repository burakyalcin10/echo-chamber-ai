from __future__ import annotations

from typing import Any


REQUIRED_FIELDS = ("id", "artist", "year", "album", "is_original", "context_notes", "genre", "mood_hint")
EMOTION_KEYS = ("surrender", "defiance", "grief", "hope", "exhaustion", "transcendence")


def validate_covers(covers: list[dict[str, Any]], *, min_count: int = 25) -> list[str]:
    errors: list[str] = []
    if len(covers) < min_count:
        errors.append(f"Expected at least {min_count} covers, found {len(covers)}")

    ids: set[str] = set()
    original_count = 0
    for index, cover in enumerate(covers, start=1):
        label = cover.get("id") or f"#{index}"
        for field in REQUIRED_FIELDS:
            if field not in cover or cover[field] in ("", None):
                errors.append(f"{label}: missing required field '{field}'")

        cover_id = cover.get("id")
        if isinstance(cover_id, str):
            if cover_id in ids:
                errors.append(f"{label}: duplicate id")
            ids.add(cover_id)
            if not cover_id.replace("_", "").replace("-", "").isalnum():
                errors.append(f"{label}: id should contain only letters, numbers, hyphens, and underscores")

        year = cover.get("year")
        if not isinstance(year, int) or not 1900 <= year <= 2100:
            errors.append(f"{label}: year must be an integer between 1900 and 2100")

        if cover.get("is_original") is True:
            original_count += 1
        elif cover.get("is_original") is not False:
            errors.append(f"{label}: is_original must be true or false")

        if len(str(cover.get("context_notes", ""))) < 80:
            errors.append(f"{label}: context_notes should be at least 80 characters")
        if len(str(cover.get("mood_hint", ""))) < 10:
            errors.append(f"{label}: mood_hint should be at least 10 characters")

        _validate_scores(label, cover, errors)

    if original_count != 1:
        errors.append(f"Expected exactly one original cover, found {original_count}")

    return errors


def _validate_scores(label: str, cover: dict[str, Any], errors: list[str]) -> None:
    scores = cover.get("emotion_scores")
    if scores is None:
        analysis = cover.get("llm_analysis") or {}
        scores = analysis.get("emotion_scores")
    if not isinstance(scores, dict):
        errors.append(f"{label}: missing emotion_scores")
        return

    for key in EMOTION_KEYS:
        if key not in scores:
            errors.append(f"{label}: missing emotion score '{key}'")
            continue
        if not _is_score(scores[key]):
            errors.append(f"{label}: emotion score '{key}' must be between 0.0 and 1.0")

    for key in ("era_tension", "political_charge", "spiritual_weight"):
        value = cover.get(key)
        if value is None:
            analysis = cover.get("llm_analysis") or {}
            value = analysis.get(key)
        if not _is_score(value):
            errors.append(f"{label}: '{key}' must be between 0.0 and 1.0")


def _is_score(value: Any) -> bool:
    return isinstance(value, int | float) and 0.0 <= float(value) <= 1.0
