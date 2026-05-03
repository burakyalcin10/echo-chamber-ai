from functools import lru_cache
from pathlib import Path
import os

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
if not os.getenv("AIKNOCK_DISABLE_DOTENV"):
    load_dotenv(BASE_DIR / ".env")
    load_dotenv(BASE_DIR / ".env.local")


class Settings:
    app_name: str = "Echo Chamber API"
    app_env: str = os.getenv("APP_ENV", "development")

    llm_provider: str = os.getenv("LLM_PROVIDER", "gemini").strip().lower()

    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or None
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    openai_api_key: str | None = os.getenv("OPENAI_API_KEY") or None
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

    data_dir: Path = BASE_DIR / "data"
    raw_covers_path: Path = BASE_DIR / "data" / "covers.json"
    processed_covers_path: Path = BASE_DIR / "data" / "processed" / "covers_with_embeddings.json"
    historical_docs_dir: Path = BASE_DIR / "data" / "historical_docs"
    chroma_dir: Path = BASE_DIR / "data" / "processed" / "chroma_db"
    rag_index_path: Path = BASE_DIR / "data" / "processed" / "rag_index.json"
    umap_reducer_path: Path = BASE_DIR / "data" / "processed" / "umap_reducer.pkl"
    umap_bounds_path: Path = BASE_DIR / "data" / "processed" / "umap_bounds.json"

    @property
    def frontend_origins(self) -> list[str]:
        raw = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000")
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def frontend_origin_regex(self) -> str | None:
        return os.getenv("FRONTEND_ORIGIN_REGEX") or None


@lru_cache
def get_settings() -> Settings:
    return Settings()
