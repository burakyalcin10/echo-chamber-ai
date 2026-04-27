from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import get_settings


REQUIRED_FIELDS = ("id", "artist", "year", "album", "is_original", "context_notes", "genre", "mood_hint")
EMOTION_KEYS = ("surrender", "defiance", "grief", "hope", "exhaustion", "transcendence")


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate Echo Chamber cover metadata.")
    parser.add_argument(
        "--path",
        type=Path,
        default=None,
        help="Optional JSON path. Defaults to backend/data/covers.json.",
    )
    parser.add_argument(
        "--min-count",
        type=int,
        default=25,
        help="Minimum number of covers required for a valid dataset.",
    )
    args = parser.parse_args()

    settings = get_settings()
    path = args.path or settings.raw_covers_path
    covers = _load_covers(path)
    errors = validate_covers(covers, min_count=args.min_count)

    if errors:
        print(f"Cover validation failed for {path}:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        raise SystemExit(1)

    print(f"Validated {len(covers)} covers from {path}")


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


def _load_covers(path: Path) -> list[dict[str, Any]]:
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError as exc:
        raise SystemExit(f"Cover file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid cover JSON: {path}") from exc

    if not isinstance(data, list):
        raise SystemExit(f"Cover file must contain a JSON list: {path}")
    return data


if __name__ == "__main__":
    main()
