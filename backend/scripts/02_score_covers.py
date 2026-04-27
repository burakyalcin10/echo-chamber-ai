from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import get_settings
from services.llm_client import get_llm_client


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
    args = parser.parse_args()

    settings = get_settings()
    covers = _load_covers(settings.raw_covers_path)
    llm = get_llm_client()
    llm.ensure_configured()

    for index, cover in enumerate(covers, start=1):
        if cover.get("llm_analysis") and not args.force:
            print(f"[{index}/{len(covers)}] skip {cover['id']}")
            continue

        print(f"[{index}/{len(covers)}] scoring {cover['id']} with {settings.llm_provider}")
        analysis = llm.generate_json(_score_prompt(cover), SCORE_SCHEMA, temperature=0.25)
        cover["llm_analysis"] = _clamp_analysis(analysis)
        _save_covers(settings.raw_covers_path, covers)
        time.sleep(args.sleep)

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


def _clamp_float(value: Any) -> float:
    return max(0.0, min(1.0, float(value)))


def _load_covers(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _save_covers(path: Path, covers: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(covers, file, indent=2, ensure_ascii=False)
        file.write("\n")


if __name__ == "__main__":
    main()
