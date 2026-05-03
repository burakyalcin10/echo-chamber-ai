from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
from functools import lru_cache
import json
import pickle
from typing import Any

import numpy as np

from config import get_settings


_EXECUTOR = ThreadPoolExecutor(max_workers=4)


def match_user_text(user_text: str, covers: list[dict[str, Any]]) -> dict[str, Any]:
    if not covers:
        raise RuntimeError("No covers available for matching.")

    if all("embedding_vector" in cover for cover in covers):
        try:
            settings = get_settings()
            future = _EXECUTOR.submit(_embedding_match, user_text, covers)
            return future.result(timeout=settings.embedding_timeout_seconds)
        except TimeoutError:
            pass
        except Exception:
            # Keep the interactive demo usable even if the local embedding stack is unavailable.
            pass

    matched = _keyword_match(user_text, covers)
    return {
        "cover": matched,
        "similarity_score": _keyword_similarity(user_text, matched),
        "user_position": matched["position"],
        "match_method": "keyword_fallback",
    }


def _embedding_match(user_text: str, covers: list[dict[str, Any]]) -> dict[str, Any]:
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise RuntimeError("Install sentence-transformers to use semantic matching.") from exc

    settings = get_settings()
    model = _get_embedding_model(settings.embedding_model)
    user_vector = np.asarray(model.encode([user_text])[0], dtype=np.float32)
    cover_vectors = np.asarray([cover["embedding_vector"] for cover in covers], dtype=np.float32)

    similarities = _cosine_similarity(user_vector, cover_vectors)
    best_index = int(np.argmax(similarities))
    matched = covers[best_index]
    score = float(similarities[best_index])

    user_position = _project_user_position(user_vector) or matched["position"]
    return {
        "cover": matched,
        "similarity_score": score,
        "user_position": user_position,
        "match_method": "embedding",
    }


@lru_cache(maxsize=1)
def _get_embedding_model(model_name: str) -> Any:
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(model_name)


def _cosine_similarity(vector: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    vector_norm = np.linalg.norm(vector)
    matrix_norms = np.linalg.norm(matrix, axis=1)
    denom = np.maximum(vector_norm * matrix_norms, 1e-8)
    return matrix @ vector / denom


def _project_user_position(user_vector: np.ndarray) -> dict[str, float] | None:
    settings = get_settings()
    if not settings.umap_reducer_path.exists() or not settings.umap_bounds_path.exists():
        return None

    _patch_umap_sklearn_compat()

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


def _patch_umap_sklearn_compat() -> None:
    try:
        import inspect
        import umap
    except ImportError:
        return

    original = umap.umap_.check_array
    signature = inspect.signature(original)
    if "force_all_finite" in signature.parameters or "ensure_all_finite" not in signature.parameters:
        return

    def compat_check_array(*args: Any, force_all_finite: Any = None, **kwargs: Any) -> Any:
        if force_all_finite is not None and "ensure_all_finite" not in kwargs:
            kwargs["ensure_all_finite"] = force_all_finite
        return original(*args, **kwargs)

    umap.umap_.check_array = compat_check_array


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


def _keyword_similarity(user_text: str, cover: dict[str, Any]) -> float:
    words = {word.strip(".,;:!?()[]{}\"'").lower() for word in user_text.split() if word.strip()}
    if not words:
        return 0.0
    haystack = " ".join(
        str(cover.get(field, ""))
        for field in ("artist", "genre", "mood_hint", "context_notes")
    ).lower()
    hits = sum(1 for word in words if word and word in haystack)
    return round(min(0.95, 0.35 + hits / max(len(words), 1)), 3)
