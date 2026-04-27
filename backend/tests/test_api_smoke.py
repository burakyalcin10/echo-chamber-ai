from fastapi.testclient import TestClient

from config import get_settings
from main import app


client = TestClient(app)


def test_health_reports_backend_state():
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["raw_covers_exists"] is True


def test_graph_returns_covers_without_embedding_vectors():
    response = client.get("/api/graph")

    assert response.status_code == 200
    covers = response.json()["covers"]
    assert covers
    assert "embedding_vector" not in covers[0]
    assert {"id", "artist", "year", "position", "emotion_scores"}.issubset(covers[0])


def test_cover_detail_for_original_song():
    response = client.get("/api/cover/dylan_1973")

    assert response.status_code == 200
    body = response.json()
    assert body["artist"] == "Bob Dylan"
    assert body["is_original"] is True


def test_match_works_without_llm_key(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "processed_covers_path", settings.data_dir / "processed" / "__missing_test.json")

    response = client.post("/api/match", json={"user_text": "I am tired and saying goodbye to an old life."})

    assert response.status_code == 200
    body = response.json()
    assert body["matched_cover"]["id"]
    assert body["bridge_text"]
    assert body["bridge_source"] in {"local_fallback", "llm"}
    assert body["match_method"] in {"keyword_fallback", "embedding"}


def test_compare_rejects_same_cover_before_llm_call():
    response = client.post("/api/compare", json={"cover_id_a": "dylan_1973", "cover_id_b": "dylan_1973"})

    assert response.status_code == 400
