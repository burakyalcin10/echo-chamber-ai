from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import get_settings


CORE_DOCS = (
    "1973_world_events.txt",
    "vietnam_and_returning_soldiers.txt",
    "pat_garrett_film_context.txt",
    "counterculture_and_dylan_1970s.txt",
    "dylan_nobel_and_songwriting.txt",
)

REQUIRED_SECTIONS = (
    "Title:",
    "Timeframe:",
    "Why it matters for Knockin' on Heaven's Door:",
    "Key facts:",
    "Emotional / cultural keywords:",
    "Short narrative:",
    "Sources:",
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate historical documents prepared for RAG.")
    parser.add_argument("--docs-dir", type=Path, default=None, help="Optional historical docs directory.")
    parser.add_argument("--min-words", type=int, default=300, help="Minimum word count per document.")
    parser.add_argument(
        "--allow-missing-core",
        action="store_true",
        help="Allow partial draft folders that do not yet contain all core documents.",
    )
    args = parser.parse_args()

    settings = get_settings()
    docs_dir = args.docs_dir or settings.historical_docs_dir
    errors = validate_rag_docs(docs_dir, min_words=args.min_words, allow_missing_core=args.allow_missing_core)

    if errors:
        print(f"RAG document validation failed for {docs_dir}:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        raise SystemExit(1)

    docs = _list_docs(docs_dir)
    print(f"Validated {len(docs)} RAG documents from {docs_dir}")


def validate_rag_docs(docs_dir: Path, *, min_words: int = 300, allow_missing_core: bool = False) -> list[str]:
    errors: list[str] = []
    docs = _list_docs(docs_dir)

    if not docs:
        return [f"No .txt or .md documents found in {docs_dir}"]

    names = {path.name for path in docs}
    missing_core = [name for name in CORE_DOCS if name not in names]
    if missing_core and not allow_missing_core:
        errors.append(f"Missing core RAG documents: {', '.join(missing_core)}")

    for path in docs:
        text = path.read_text(encoding="utf-8").strip()
        if not text:
            errors.append(f"{path.name}: document is empty")
            continue

        for section in REQUIRED_SECTIONS:
            if section not in text:
                errors.append(f"{path.name}: missing section '{section}'")

        word_count = len(text.split())
        if word_count < min_words:
            errors.append(f"{path.name}: expected at least {min_words} words, found {word_count}")

        if text.count("http://") + text.count("https://") == 0 and "Sources:" in text:
            errors.append(f"{path.name}: include at least one URL source when possible")

    return errors


def _list_docs(docs_dir: Path) -> list[Path]:
    if not docs_dir.exists():
        return []
    return sorted([*docs_dir.glob("*.txt"), *docs_dir.glob("*.md")])


if __name__ == "__main__":
    main()
