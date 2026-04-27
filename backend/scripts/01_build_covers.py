from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import get_settings
from services.cover_validation import validate_covers


def main() -> None:
    parser = argparse.ArgumentParser(description="Merge, normalize, and validate Echo Chamber cover metadata.")
    parser.add_argument("--input", type=Path, default=None, help="Base cover JSON path.")
    parser.add_argument("--additions", type=Path, default=None, help="Optional JSON list of new covers to merge.")
    parser.add_argument("--output", type=Path, default=None, help="Output path. Defaults to input path.")
    parser.add_argument("--replace", action="store_true", help="Allow additions to replace existing covers with same id.")
    parser.add_argument("--write", action="store_true", help="Write merged output. Default is dry-run only.")
    parser.add_argument("--target-count", type=int, default=50, help="Target cover count for strong submission.")
    parser.add_argument("--min-count", type=int, default=25, help="Minimum cover count for validation.")
    args = parser.parse_args()

    settings = get_settings()
    input_path = args.input or settings.raw_covers_path
    output_path = args.output or input_path

    base_covers = _load_json_list(input_path)
    additions = _load_json_list(args.additions) if args.additions else []
    merged = merge_covers(base_covers, additions, replace=args.replace)
    normalized = [normalize_cover(cover) for cover in merged]
    normalized = sorted(normalized, key=lambda cover: (not cover.get("is_original", False), cover["year"], cover["artist"]))

    errors = validate_covers(normalized, min_count=args.min_count)
    if errors:
        print("Cover build validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        raise SystemExit(1)

    gap = max(args.target_count - len(normalized), 0)
    print(f"Base covers: {len(base_covers)}")
    print(f"Additions: {len(additions)}")
    print(f"Merged covers: {len(normalized)}")
    print(f"Target count: {args.target_count}")
    print(f"Remaining gap: {gap}")

    if not args.write:
        print("Dry-run only. Re-run with --write to update the output file.")
        return

    _save_json(output_path, normalized)
    print(f"Wrote {len(normalized)} covers to {output_path}")


def merge_covers(
    base_covers: list[dict[str, Any]],
    additions: list[dict[str, Any]],
    *,
    replace: bool = False,
) -> list[dict[str, Any]]:
    by_id: dict[str, dict[str, Any]] = {}
    for cover in base_covers:
        normalized = normalize_cover(cover)
        cover_id = normalized["id"]
        if cover_id in by_id:
            raise ValueError(f"Duplicate base cover id: {cover_id}")
        by_id[cover_id] = normalized

    for cover in additions:
        normalized = normalize_cover(cover)
        cover_id = normalized["id"]
        if cover_id in by_id and not replace:
            raise ValueError(f"Addition duplicates existing cover id without --replace: {cover_id}")
        by_id[cover_id] = normalized

    return list(by_id.values())


def normalize_cover(cover: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(cover)
    for key, value in list(normalized.items()):
        if isinstance(value, str):
            normalized[key] = " ".join(value.split())

    if not normalized.get("id"):
        normalized["id"] = _slug_id(normalized.get("artist", "unknown"), normalized.get("year", "unknown"))

    normalized["id"] = _slug(str(normalized["id"]))
    if "year" in normalized:
        normalized["year"] = int(normalized["year"])
    if "is_original" not in normalized:
        normalized["is_original"] = False
    return normalized


def _slug_id(artist: Any, year: Any) -> str:
    return f"{_slug(str(artist))}_{year}"


def _slug(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", value.strip().lower()).strip("_")
    return slug or "unknown"


def _load_json_list(path: Path | None) -> list[dict[str, Any]]:
    if path is None:
        return []
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError as exc:
        raise SystemExit(f"Cover file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid cover JSON: {path}") from exc
    if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
        raise SystemExit(f"Cover file must contain a JSON list of objects: {path}")
    return data


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
        file.write("\n")


if __name__ == "__main__":
    try:
        main()
    except ValueError as exc:
        print(f"Cover build failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
