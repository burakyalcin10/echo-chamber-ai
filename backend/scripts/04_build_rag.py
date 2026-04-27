from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import get_settings


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the local historical-docs RAG index.")
    parser.add_argument("--docs-dir", type=Path, default=None, help="Optional historical docs directory.")
    parser.add_argument("--dry-run", action="store_true", help="List documents and chunks without loading models.")
    args = parser.parse_args()

    settings = get_settings()
    docs_dir = args.docs_dir or settings.historical_docs_dir
    docs_dir.mkdir(parents=True, exist_ok=True)

    documents = sorted([*docs_dir.glob("*.txt"), *docs_dir.glob("*.md")])
    if not documents:
        if args.dry_run:
            print(f"No historical docs found in {docs_dir}")
            return
        raise SystemExit(f"No historical docs found in {docs_dir}")

    chunks = []
    for path in documents:
        text = path.read_text(encoding="utf-8").strip()
        for index, chunk_text in enumerate(_chunk_text(text)):
            chunks.append(
                {
                    "id": f"{path.stem}_{index}",
                    "source": path.name,
                    "text": chunk_text,
                }
            )

    if args.dry_run:
        print(f"Historical docs: {len(documents)}")
        print(f"Chunks prepared: {len(chunks)}")
        for path in documents:
            print(f"- {path.name}")
        return

    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(settings.embedding_model)
    vectors = model.encode([chunk["text"] for chunk in chunks])
    for chunk, vector in zip(chunks, vectors):
        chunk["embedding"] = vector.tolist()

    settings.rag_index_path.parent.mkdir(parents=True, exist_ok=True)
    _save_json(settings.rag_index_path, chunks)
    print(f"Indexed {len(chunks)} chunks from {len(documents)} documents.")
    print(f"Saved RAG index to {settings.rag_index_path}")


def _chunk_text(text: str, *, max_words: int = 220, overlap: int = 40) -> list[str]:
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + max_words, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start = max(0, end - overlap)
    return chunks


def _save_json(path: Path, data: Any) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
        file.write("\n")


if __name__ == "__main__":
    main()
