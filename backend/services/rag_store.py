from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
from functools import lru_cache
import json
from typing import Any

import numpy as np

from config import get_settings


_EXECUTOR = ThreadPoolExecutor(max_workers=4)


def retrieve_historical_context(query: str, *, top_k: int = 3) -> tuple[str, list[str]]:
    settings = get_settings()
    future = _EXECUTOR.submit(_retrieve_historical_context, query, top_k=top_k)
    try:
        return future.result(timeout=settings.embedding_timeout_seconds)
    except TimeoutError:
        return "", []


def _retrieve_historical_context(query: str, *, top_k: int = 3) -> tuple[str, list[str]]:
    settings = get_settings()
    if not settings.rag_index_path.exists():
        return "", []

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        return "", []

    with settings.rag_index_path.open("r", encoding="utf-8") as file:
        chunks: list[dict[str, Any]] = json.load(file)
    if not chunks:
        return "", []

    model = _get_embedding_model(settings.embedding_model)
    query_vector = np.asarray(model.encode([query])[0], dtype=np.float32)
    matrix = np.asarray([chunk["embedding"] for chunk in chunks], dtype=np.float32)
    scores = _cosine_similarity(query_vector, matrix)
    best_indices = np.argsort(scores)[-top_k:][::-1]

    selected = [chunks[int(index)] for index in best_indices]
    context = "\n\n".join(f"[{chunk['source']}]\n{chunk['text']}" for chunk in selected)
    sources = sorted({chunk["source"] for chunk in selected})
    return context, sources


@lru_cache(maxsize=1)
def _get_embedding_model(model_name: str) -> Any:
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(model_name)


def _cosine_similarity(vector: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    vector_norm = np.linalg.norm(vector)
    matrix_norms = np.linalg.norm(matrix, axis=1)
    denom = np.maximum(vector_norm * matrix_norms, 1e-8)
    return matrix @ vector / denom
