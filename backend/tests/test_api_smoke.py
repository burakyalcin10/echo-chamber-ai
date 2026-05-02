from fastapi.testclient import TestClient

from config import get_settings
import main as main_module
from main import app


client = TestClient(app)


def test_health_reports_backend_state():
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["raw_covers_exists"] is True
    assert body["raw_cover_count"] >= 25
    assert "processed_cover_count" in body
    assert "processed_data_stale" in body


def test_graph_returns_covers_without_embedding_vectors():
    response = client.get("/api/graph")

    assert response.status_code == 200
    covers = response.json()["covers"]
    assert covers
    assert len(covers) >= 32
    assert "embedding_vector" not in covers[0]
    assert {"id", "artist", "year", "position", "emotion_scores"}.issubset(covers[0])
    assert any(cover.get("artist_image_url") for cover in covers)


def test_cover_detail_for_original_song():
    response = client.get("/api/cover/dylan_1973")

    assert response.status_code == 200
    body = response.json()
    assert body["artist"] == "Bob Dylan"
    assert body["is_original"] is True
    assert body["artist_image_url"]


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


def test_compare_works_without_llm_key():
    response = client.post("/api/compare", json={"cover_id_a": "dylan_1973", "cover_id_b": "gnr_1990"})

    assert response.status_code == 200
    body = response.json()
    assert body["analysis"]
    assert body["analysis_source"] in {"local_fallback", "llm"}
    assert body["shift_direction"]


def test_voice_works_without_llm_key(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "rag_index_path", settings.data_dir / "processed" / "__missing_rag_test.json")

    response = client.post("/api/voice", json={"cover_id": "dylan_1973"})

    assert response.status_code == 200
    body = response.json()
    assert body["monologue"]
    assert body["monologue_source"] in {"local_fallback", "llm"}
    assert body["artist"] == "Bob Dylan"


def test_compare_uses_llm_when_configured(monkeypatch):
    requested_providers = []

    class FakeLLM:
        def is_configured(self):
            return True

        def generate_text(self, prompt, *, temperature):
            return "LLM comparison text"

    def fake_get_llm_client(provider=None):
        requested_providers.append(provider)
        return FakeLLM()

    monkeypatch.setattr(main_module, "get_llm_client", fake_get_llm_client)

    response = client.post("/api/compare", json={"cover_id_a": "dylan_1973", "cover_id_b": "gnr_1990"})

    assert response.status_code == 200
    body = response.json()
    assert body["analysis"] == "LLM comparison text"
    assert body["analysis_source"] == "llm"
    assert requested_providers == ["openai"]


def test_openapi_exposes_response_models():
    response = client.get("/openapi.json")

    assert response.status_code == 200
    openapi = response.json()
    schemas = openapi["components"]["schemas"]
    assert "GraphResponse" in schemas
    assert "CoverDetailResponse" in schemas
    assert "CompareResponse" in schemas
    assert "VoiceResponse" in schemas
    assert "MatchResponse" in schemas
