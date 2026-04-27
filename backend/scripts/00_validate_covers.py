from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import get_settings
from services.cover_validation import validate_covers


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
