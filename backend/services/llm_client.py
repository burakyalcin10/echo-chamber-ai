from __future__ import annotations

import json
import re
from typing import Any

from fastapi import HTTPException

from config import get_settings


class LLMClient:
    def __init__(self, provider: str | None = None) -> None:
        self.settings = get_settings()
        self.provider = (provider or self.settings.llm_provider).strip().lower()

    def is_configured(self) -> bool:
        if self.provider == "gemini":
            return bool(self.settings.gemini_api_key)
        if self.provider == "openai":
            return bool(self.settings.openai_api_key)
        return False

    def ensure_configured(self) -> None:
        if self.is_configured():
            return
        key_name = "GEMINI_API_KEY" if self.provider == "gemini" else "OPENAI_API_KEY"
        raise HTTPException(
            status_code=503,
            detail=f"LLM provider '{self.provider}' is not configured. Set {key_name} in backend/.env.",
        )

    def generate_text(self, prompt: str, *, temperature: float = 0.7) -> str:
        self.ensure_configured()
        if self.provider == "gemini":
            return self._gemini_text(prompt, temperature=temperature)
        if self.provider == "openai":
            return self._openai_text(prompt, temperature=temperature)
        raise HTTPException(status_code=500, detail=f"Unsupported LLM provider: {self.provider}")

    def generate_json(self, prompt: str, schema: dict[str, Any], *, temperature: float = 0.2) -> dict[str, Any]:
        self.ensure_configured()
        if self.provider == "gemini":
            text = self._gemini_text(prompt, temperature=temperature, response_json_schema=schema)
        elif self.provider == "openai":
            text = self._openai_text(prompt, temperature=temperature, json_schema=schema)
        else:
            raise HTTPException(status_code=500, detail=f"Unsupported LLM provider: {self.provider}")

        return _parse_json_response(text)

    def _openai_text(
        self,
        prompt: str,
        *,
        temperature: float,
        json_schema: dict[str, Any] | None = None,
    ) -> str:
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise HTTPException(status_code=503, detail="Install the openai package first.") from exc

        client = OpenAI(api_key=self.settings.openai_api_key)
        if not hasattr(client, "responses"):
            return self._openai_chat_text(client, prompt, temperature=temperature, json_schema=json_schema)

        kwargs: dict[str, Any] = {
            "model": self.settings.openai_model,
            "input": prompt,
            "temperature": temperature,
        }
        if json_schema:
            kwargs["text"] = {
                "format": {
                    "type": "json_schema",
                    "name": "echo_chamber_response",
                    "schema": json_schema,
                    "strict": True,
                }
            }

        response = client.responses.create(**kwargs)
        return getattr(response, "output_text", None) or _extract_openai_text(response)

    def _openai_chat_text(
        self,
        client: Any,
        prompt: str,
        *,
        temperature: float,
        json_schema: dict[str, Any] | None = None,
    ) -> str:
        kwargs: dict[str, Any] = {
            "model": self.settings.openai_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
        }
        if json_schema:
            kwargs["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": "echo_chamber_response",
                    "schema": json_schema,
                    "strict": True,
                },
            }

        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    def _gemini_text(
        self,
        prompt: str,
        *,
        temperature: float,
        response_json_schema: dict[str, Any] | None = None,
    ) -> str:
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:
            raise HTTPException(status_code=503, detail="Install the google-genai package first.") from exc

        client = genai.Client(api_key=self.settings.gemini_api_key)
        config_kwargs: dict[str, Any] = {
            "temperature": temperature,
        }
        if response_json_schema:
            config_kwargs["response_mime_type"] = "application/json"
            config_kwargs["response_schema"] = _strip_schema_keywords(
                response_json_schema,
                {"additionalProperties"},
            )

        response = client.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(**config_kwargs),
        )
        return response.text or ""


def get_llm_client(provider: str | None = None) -> LLMClient:
    return LLMClient(provider=provider)


def _extract_openai_text(response: Any) -> str:
    chunks: list[str] = []
    for item in getattr(response, "output", []) or []:
        for content in getattr(item, "content", []) or []:
            text = getattr(content, "text", None)
            if text:
                chunks.append(text)
    return "\n".join(chunks)


def _strip_schema_keywords(schema: Any, keywords: set[str]) -> Any:
    if isinstance(schema, dict):
        return {
            key: _strip_schema_keywords(value, keywords)
            for key, value in schema.items()
            if key not in keywords
        }
    if isinstance(schema, list):
        return [_strip_schema_keywords(item, keywords) for item in schema]
    return schema


def _parse_json_response(text: str) -> dict[str, Any]:
    cleaned = _strip_code_fence(text.strip())
    if not cleaned:
        raise HTTPException(status_code=502, detail="LLM returned an empty response.")
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON.") from exc
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=502, detail="LLM JSON response must be an object.")
    return parsed


def _strip_code_fence(text: str) -> str:
    match = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else text
