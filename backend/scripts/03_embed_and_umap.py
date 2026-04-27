from __future__ import annotations

import json
import pickle
import sys
from pathlib import Path
from typing import Any

import numpy as np
import umap
from sentence_transformers import SentenceTransformer

sys.path.append(str(Path(__file__).resolve().parents[1]))

from config import get_settings


def main() -> None:
    settings = get_settings()
    covers = _load_covers(settings.raw_covers_path)
    if len(covers) < 3:
        raise SystemExit("Need at least 3 covers for UMAP.")

    _patch_umap_sklearn_compat()

    model = SentenceTransformer(settings.embedding_model)
    texts = [build_embedding_text(cover) for cover in covers]
    vectors = np.asarray(model.encode(texts), dtype=np.float32)

    reducer = umap.UMAP(
        n_components=3,
        n_neighbors=min(8, max(2, len(covers) - 1)),
        min_dist=0.3,
        random_state=42,
    )
    coords = reducer.fit_transform(vectors)
    bounds = _bounds(coords)

    for index, cover in enumerate(covers):
        cover["position"] = _normalize_position(coords[index], bounds)
        cover["embedding_vector"] = np.asarray(vectors[index], dtype=float).tolist()

    settings.processed_covers_path.parent.mkdir(parents=True, exist_ok=True)
    _save_json(settings.processed_covers_path, covers)
    _save_json(settings.umap_bounds_path, bounds)
    with settings.umap_reducer_path.open("wb") as file:
        pickle.dump(reducer, file)

    print(f"Saved processed covers to {settings.processed_covers_path}")
    print(f"Saved UMAP reducer to {settings.umap_reducer_path}")


def _patch_umap_sklearn_compat() -> None:
    """Support newer scikit-learn versions where force_all_finite was renamed."""
    import inspect

    original = umap.umap_.check_array
    signature = inspect.signature(original)
    if "force_all_finite" in signature.parameters or "ensure_all_finite" not in signature.parameters:
        return

    def compat_check_array(*args: Any, force_all_finite: Any = None, **kwargs: Any) -> Any:
        if force_all_finite is not None and "ensure_all_finite" not in kwargs:
            kwargs["ensure_all_finite"] = force_all_finite
        return original(*args, **kwargs)

    umap.umap_.check_array = compat_check_array


def build_embedding_text(cover: dict[str, Any]) -> str:
    analysis = cover.get("llm_analysis") or {}
    scores = analysis.get("emotion_scores") or cover.get("emotion_scores") or {}
    return (
        f"{cover['artist']} {cover['year']}. "
        f"{cover.get('context_notes', '')} "
        f"{analysis.get('meaning_shift', cover.get('mood_hint', ''))} "
        f"Surrender:{scores.get('surrender', 0.5):.1f} "
        f"Defiance:{scores.get('defiance', 0.5):.1f} "
        f"Grief:{scores.get('grief', 0.5):.1f} "
        f"Hope:{scores.get('hope', 0.5):.1f} "
        f"Exhaustion:{scores.get('exhaustion', 0.5):.1f} "
        f"Transcendence:{scores.get('transcendence', 0.5):.1f}"
    )


def _bounds(coords: np.ndarray) -> dict[str, dict[str, float]]:
    return {
        "x": {"min": float(coords[:, 0].min()), "max": float(coords[:, 0].max())},
        "y": {"min": float(coords[:, 1].min()), "max": float(coords[:, 1].max())},
        "z": {"min": float(coords[:, 2].min()), "max": float(coords[:, 2].max())},
    }


def _normalize_position(point: np.ndarray, bounds: dict[str, dict[str, float]]) -> dict[str, float]:
    normalized = []
    for axis, value in zip(("x", "y", "z"), point):
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


def _load_covers(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _save_json(path: Path, data: Any) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
        file.write("\n")


if __name__ == "__main__":
    main()
