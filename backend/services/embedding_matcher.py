from __future__ import annotations

import json
import pickle
from typing import Any

import numpy as np

from config import get_settings


def match_user_text(user_text: str, covers: list[dict[str, Any]]) -> tuple[dict[str, Any], float, dict[str, float]]:
    if covers and all("embedding_vector" in cover for cover in covers):
        return _embedding_match(user_text, covers)

    matched = _keyword_match(user_text, covers)
    return matched, 0.5, matched["position"]


def _embedding_match(user_text: str, covers: list[dict[str, Any]]) -> tuple[dict[str, Any], float, dict[str, float]]:
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise RuntimeError("Install sentence-transformers to use semantic matching.") from exc

    settings = get_settings()
    model = SentenceTransformer(settings.embedding_model)
    user_vector = np.asarray(model.encode([user_text])[0], dtype=np.float32)
    cover_vectors = np.asarray([cover["embedding_vector"] for cover in covers], dtype=np.float32)

    similarities = _cosine_similarity(user_vector, cover_vectors)
    best_index = int(np.argmax(similarities))
    matched = covers[best_index]
    score = float(similarities[best_index])

    user_position = _project_user_position(user_vector) or matched["position"]
    return matched, score, user_position


def _cosine_similarity(vector: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    vector_norm = np.linalg.norm(vector)
    matrix_norms = np.linalg.norm(matrix, axis=1)
    denom = np.maximum(vector_norm * matrix_norms, 1e-8)
    return matrix @ vector / denom


def _project_user_position(user_vector: np.ndarray) -> dict[str, float] | None:
    settings = get_settings()
    if not settings.umap_reducer_path.exists() or not settings.umap_bounds_path.exists():
        return None

    with settings.umap_reducer_path.open("rb") as file:
        reducer = pickle.load(file)
    with settings.umap_bounds_path.open("r", encoding="utf-8") as file:
        bounds = json.load(file)

    raw = reducer.transform([user_vector])[0]
    normalized = []
    for axis, value in zip(("x", "y", "z"), raw):
        axis_min = bounds[axis]["min"]
        axis_max = bounds[axis]["max"]
        if axis_max == axis_min:
            normalized.append(0.0)
        else:
            normalized.append(float(np.interp(value, [axis_min, axis_max], [-8, 8])))

    return {
        "x": round(normalized[0], 3),
        "y": round(normalized[1], 3),
        "z": round(normalized[2], 3),
    }


def _keyword_match(user_text: str, covers: list[dict[str, Any]]) -> dict[str, Any]:
    words = {word.strip(".,;:!?()[]{}\"'").lower() for word in user_text.split()}
    best_cover = covers[0]
    best_score = -1
    for cover in covers:
        haystack = " ".join(
            str(cover.get(field, ""))
            for field in ("artist", "genre", "mood_hint", "context_notes")
        ).lower()
        score = sum(1 for word in words if word and word in haystack)
        if score > best_score:
            best_cover = cover
            best_score = score
    return best_cover
