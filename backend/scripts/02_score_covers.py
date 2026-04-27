from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from pathlib import Path
from typing import Any

from fastapi import HTTPException

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import get_settings
from services.llm_client import get_llm_client


EMOTION_KEYS = ("surrender", "defiance", "grief", "hope", "exhaustion", "transcendence")

SCORE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "emotion_scores": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "surrender": {"type": "number"},
                "defiance": {"type": "number"},
                "grief": {"type": "number"},
                "hope": {"type": "number"},
                "exhaustion": {"type": "number"},
                "transcendence": {"type": "number"},
            },
            "required": ["surrender", "defiance", "grief", "hope", "exhaustion", "transcendence"],
        },
        "era_tension": {"type": "number"},
        "political_charge": {"type": "number"},
        "spiritual_weight": {"type": "number"},
        "meaning_shift": {"type": "string"},
        "historical_pulse": {"type": "string"},
    },
    "required": [
        "emotion_scores",
        "era_tension",
        "political_charge",
        "spiritual_weight",
        "meaning_shift",
        "historical_pulse",
    ],
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Score covers with the configured Gemini/OpenAI provider.")
    parser.add_argument("--force", action="store_true", help="Rescore covers that already have llm_analysis.")
    parser.add_argument("--sleep", type=float, default=1.0, help="Delay between LLM calls.")
    parser.add_argument("--limit", type=int, default=None, help="Score at most N pending covers.")
    parser.add_argument("--ids", default="", help="Comma-separated cover ids to score.")
    parser.add_argument("--retries", type=int, default=3, help="Attempts per cover before failing.")
    parser.add_argument("--retry-base-delay", type=float, default=2.0, help="Base delay for exponential backoff.")
    parser.add_argument("--no-cache", action="store_true", help="Ignore and do not update the local score cache.")
    parser.add_argument("--continue-on-error", action="store_true", help="Keep scoring later covers after a failure.")
    parser.add_argument("--dry-run", action="store_true", help="Validate inputs and list covers without calling an LLM.")
    args = parser.parse_args()

    settings = get_settings()
    covers = _load_covers(settings.raw_covers_path)
    _validate_cover_inputs(covers)
    selected_ids = _parse_ids(args.ids)
    pending = _select_pending_covers(covers, selected_ids=selected_ids, force=args.force, limit=args.limit)

    print(f"Provider: {settings.llm_provider}")
    print(f"Model: {_active_model_name(settings)}")
    print(f"Covers in file: {len(covers)}")
    print(f"Covers selected for scoring: {len(pending)}")

    if args.dry_run:
        for index, cover in pending:
            print(f"[dry-run] {index + 1}/{len(covers)} {cover['id']}")
        return

    llm = get_llm_client()
    try:
        llm.ensure_configured()
    except HTTPException as exc:
        print(f"Configuration error: {exc.detail}", file=sys.stderr)
        raise SystemExit(2) from exc

    cache_path = settings.data_dir / "processed" / "score_cache.json"
    cache = {} if args.no_cache else _load_cache(cache_path)
    failures: list[str] = []

    for index, cover in pending:
        prompt = _score_prompt(cover)
        cache_key = _cache_key(settings.llm_provider, _active_model_name(settings), cover, prompt)
        print(f"[{index + 1}/{len(covers)}] scoring {cover['id']} with {settings.llm_provider}")

        try:
            if not args.no_cache and cache_key in cache:
                analysis = _validate_analysis(cache[cache_key])
                print(f"  cache hit")
            else:
                analysis = _generate_with_retry(
                    llm,
                    prompt,
                    retries=args.retries,
                    retry_base_delay=args.retry_base_delay,
                )
                analysis = _validate_analysis(analysis)
                if not args.no_cache:
                    cache[cache_key] = analysis
                    _save_json(cache_path, cache)

            cover["llm_analysis"] = _clamp_analysis(analysis)
        except Exception as exc:
            failures.append(f"{cover['id']}: {exc}")
            print(f"  failed: {exc}", file=sys.stderr)
            if not args.continue_on_error:
                _save_covers(settings.raw_covers_path, covers)
                raise SystemExit(1) from exc
            continue

        _save_covers(settings.raw_covers_path, covers)
        time.sleep(args.sleep)

    if failures:
        print("Completed with failures:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        raise SystemExit(1)

    print(f"Saved scored covers to {settings.raw_covers_path}")


def _score_prompt(cover: dict[str, Any]) -> str:
    return f"""
You are a musicologist and cultural historian.
Analyze this cover of "Knockin' on Heaven's Door".

Artist: {cover['artist']}
Year: {cover['year']}
Album/context: {cover.get('album', '')}
Historical notes: {cover.get('context_notes', '')}
Genre: {cover.get('genre', '')}
Mood hint: {cover.get('mood_hint', '')}

Return JSON only. Scores must be between 0.0 and 1.0.
meaning_shift: one sentence explaining how this version reinterprets the song.
historical_pulse: one sentence naming the era pressure around the recording.
""".strip()


def _clamp_analysis(analysis: dict[str, Any]) -> dict[str, Any]:
    for key in ("era_tension", "political_charge", "spiritual_weight"):
        analysis[key] = _clamp_float(analysis[key])
    for key, value in analysis["emotion_scores"].items():
        analysis["emotion_scores"][key] = _clamp_float(value)
    return analysis


def _validate_analysis(analysis: dict[str, Any]) -> dict[str, Any]:
    required_top_level = {
        "emotion_scores",
        "era_tension",
        "political_charge",
        "spiritual_weight",
        "meaning_shift",
        "historical_pulse",
    }
    missing = sorted(required_top_level - analysis.keys())
    if missing:
        raise ValueError(f"LLM analysis is missing fields: {', '.join(missing)}")

    scores = analysis["emotion_scores"]
    if not isinstance(scores, dict):
        raise ValueError("emotion_scores must be an object")
    missing_scores = [key for key in EMOTION_KEYS if key not in scores]
    if missing_scores:
        raise ValueError(f"emotion_scores is missing fields: {', '.join(missing_scores)}")

    for key in ("era_tension", "political_charge", "spiritual_weight"):
        _clamp_float(analysis[key])
    for key in EMOTION_KEYS:
        _clamp_float(scores[key])
    for key in ("meaning_shift", "historical_pulse"):
        if not isinstance(analysis[key], str) or not analysis[key].strip():
            raise ValueError(f"{key} must be a non-empty string")
    return analysis


def _clamp_float(value: Any) -> float:
    return max(0.0, min(1.0, float(value)))


def _validate_cover_inputs(covers: list[dict[str, Any]]) -> None:
    required = ("id", "artist", "year", "context_notes", "genre")
    seen_ids: set[str] = set()
    for index, cover in enumerate(covers, start=1):
        missing = [field for field in required if field not in cover or cover[field] in ("", None)]
        if missing:
            raise SystemExit(f"Cover #{index} is missing required fields: {', '.join(missing)}")
        if cover["id"] in seen_ids:
            raise SystemExit(f"Duplicate cover id: {cover['id']}")
        seen_ids.add(cover["id"])


def _select_pending_covers(
    covers: list[dict[str, Any]],
    *,
    selected_ids: set[str],
    force: bool,
    limit: int | None,
) -> list[tuple[int, dict[str, Any]]]:
    pending = []
    known_ids = {cover["id"] for cover in covers}
    unknown_ids = sorted(selected_ids - known_ids)
    if unknown_ids:
        raise SystemExit(f"Unknown cover ids: {', '.join(unknown_ids)}")

    for index, cover in enumerate(covers):
        if selected_ids and cover["id"] not in selected_ids:
            continue
        if cover.get("llm_analysis") and not force:
            continue
        pending.append((index, cover))
        if limit is not None and len(pending) >= limit:
            break
    return pending


def _generate_with_retry(llm: Any, prompt: str, *, retries: int, retry_base_delay: float) -> dict[str, Any]:
    attempts = max(1, retries)
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return llm.generate_json(prompt, SCORE_SCHEMA, temperature=0.25)
        except Exception as exc:
            last_error = exc
            if attempt == attempts:
                break
            delay = retry_base_delay * (2 ** (attempt - 1))
            print(f"  attempt {attempt} failed; retrying in {delay:.1f}s: {exc}", file=sys.stderr)
            time.sleep(delay)
    raise RuntimeError(f"LLM scoring failed after {attempts} attempts: {last_error}") from last_error


def _parse_ids(raw: str) -> set[str]:
    return {item.strip() for item in raw.split(",") if item.strip()}


def _active_model_name(settings: Any) -> str:
    if settings.llm_provider == "gemini":
        return settings.gemini_model
    if settings.llm_provider == "openai":
        return settings.openai_model
    return "unknown"


def _cache_key(provider: str, model: str, cover: dict[str, Any], prompt: str) -> str:
    fingerprint = hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16]
    return f"{provider}:{model}:{cover['id']}:{fingerprint}"


def _load_cache(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid score cache JSON at {path}") from exc
    if not isinstance(data, dict):
        raise SystemExit(f"Score cache must be a JSON object: {path}")
    return data


def _load_covers(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _save_covers(path: Path, covers: list[dict[str, Any]]) -> None:
    _save_json(path, covers)


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
        file.write("\n")


if __name__ == "__main__":
    main()
