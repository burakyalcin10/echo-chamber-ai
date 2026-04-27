import subprocess
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_validate_covers_script_accepts_current_dataset():
    result = subprocess.run(
        [sys.executable, "scripts/00_validate_covers.py"],
        cwd=BACKEND_DIR,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0
    assert "Validated" in result.stdout


def test_validate_rag_docs_reports_missing_documents():
    result = subprocess.run(
        [sys.executable, "scripts/00_validate_rag_docs.py"],
        cwd=BACKEND_DIR,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 1
    assert "No .txt or .md documents found" in result.stderr


def test_validate_rag_docs_accepts_well_formed_draft(tmp_path):
    doc = tmp_path / "draft.txt"
    doc.write_text(
        "\n".join(
            [
                "Title: Draft",
                "Timeframe: 1973",
                "Why it matters for Knockin' on Heaven's Door:",
                "This draft connects the song to a historical threshold.",
                "Key facts:",
                "- Fact one",
                "- Fact two",
                "Emotional / cultural keywords:",
                "- exhaustion",
                "- farewell",
                "Short narrative:",
                " ".join(["This is a grounded historical note about farewell and cultural exhaustion."] * 5),
                "Sources:",
                "- https://example.com/source",
            ]
        ),
        encoding="utf-8",
    )

    result = subprocess.run(
        [
            sys.executable,
            "scripts/00_validate_rag_docs.py",
            "--docs-dir",
            str(tmp_path),
            "--allow-missing-core",
            "--min-words",
            "20",
        ],
        cwd=BACKEND_DIR,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0
    assert "Validated 1 RAG documents" in result.stdout


def test_score_script_dry_run_lists_pending_covers():
    result = subprocess.run(
        [sys.executable, "scripts/02_score_covers.py", "--dry-run", "--limit", "2"],
        cwd=BACKEND_DIR,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0
    assert "Covers selected for scoring: 2" in result.stdout
    assert "[dry-run]" in result.stdout


def test_score_script_reports_missing_provider_key_cleanly():
    result = subprocess.run(
        [sys.executable, "scripts/02_score_covers.py", "--limit", "1"],
        cwd=BACKEND_DIR,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 2
    assert "Configuration error:" in result.stderr
    assert "GEMINI_API_KEY" in result.stderr or "OPENAI_API_KEY" in result.stderr


def test_embedding_script_dry_run_validates_without_model_load():
    result = subprocess.run(
        [sys.executable, "scripts/03_embed_and_umap.py", "--dry-run"],
        cwd=BACKEND_DIR,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0
    assert "Covers in file:" in result.stdout
    assert "Embedding texts prepared:" in result.stdout


def test_rag_build_dry_run_handles_missing_docs_without_model_load():
    result = subprocess.run(
        [sys.executable, "scripts/04_build_rag.py", "--dry-run"],
        cwd=BACKEND_DIR,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0
    assert "No historical docs found" in result.stdout
