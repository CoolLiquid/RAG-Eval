from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx

from app.schemas.settings import (
    EvaluationDefaults,
    LlmConfigPublic,
    LlmConfigUpdate,
    LlmModelName,
    SettingsResponse,
    SettingsUpdate,
    TestLlmRequest,
    TestLlmResponse,
)


def _mask_secret(secret: str) -> str:
    if not secret:
        return "—"
    if len(secret) <= 4:
        return "••••"
    return "••••" + secret[-4:]


def _validate_base_url(url: str) -> None:
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("API Base URL 格式无效，需以 http:// 或 https:// 开头")


def _should_mock_llm(base_url: str) -> bool:
    lowered = base_url.lower()
    return "mock" in lowered or lowered.endswith(".example.com") or "localhost" in lowered


@dataclass
class LlmConfigRecord:
    api_base_url: str = "https://api.openai.com/v1"
    model_name: LlmModelName = "gpt-4o-mini"
    api_key: str = ""


@dataclass
class SettingsRecord:
    llm: LlmConfigRecord = field(default_factory=LlmConfigRecord)
    evaluation_defaults: EvaluationDefaults = field(default_factory=EvaluationDefaults)
    updated_at: datetime | None = None


_store = SettingsRecord()


def _to_response(record: SettingsRecord) -> SettingsResponse:
    llm = record.llm
    return SettingsResponse(
        llm=LlmConfigPublic(
            api_base_url=llm.api_base_url,
            model_name=llm.model_name,
            api_key_configured=bool(llm.api_key.strip()),
            api_key_masked=_mask_secret(llm.api_key) if llm.api_key.strip() else None,
        ),
        evaluation_defaults=record.evaluation_defaults,
        updated_at=record.updated_at,
    )


def get_settings() -> SettingsResponse:
    return _to_response(_store)


def update_settings(data: SettingsUpdate) -> SettingsResponse:
    if data.llm is not None:
        _apply_llm_update(_store.llm, data.llm)
    if data.evaluation_defaults is not None:
        _store.evaluation_defaults = data.evaluation_defaults

    _store.updated_at = datetime.now(timezone.utc)
    return _to_response(_store)


def _apply_llm_update(record: LlmConfigRecord, update: LlmConfigUpdate) -> None:
    if update.api_base_url is not None:
        _validate_base_url(update.api_base_url)
        record.api_base_url = update.api_base_url.strip().rstrip("/")

    if update.model_name is not None:
        record.model_name = update.model_name

    if update.api_key is not None and update.api_key.strip():
        record.api_key = update.api_key.strip()


def test_llm_connection(payload: TestLlmRequest | None = None) -> TestLlmResponse:
    payload = payload or TestLlmRequest()
    base_url = (payload.api_base_url or _store.llm.api_base_url).strip().rstrip("/")
    model_name = payload.model_name or _store.llm.model_name
    api_key = payload.api_key if payload.api_key is not None else _store.llm.api_key

    try:
        _validate_base_url(base_url)
    except ValueError as exc:
        return TestLlmResponse(success=False, message=str(exc))

    if not api_key.strip():
        return TestLlmResponse(success=False, message="请先配置 API Key")

    if _should_mock_llm(base_url):
        return TestLlmResponse(
            success=True,
            message=f"LLM 连接成功（Mock 模式，模型 {model_name}）",
            latency_ms=120,
        )

    start = time.perf_counter()
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(
                f"{base_url}/models",
                headers={"Authorization": f"Bearer {api_key.strip()}"},
            )
        latency_ms = int((time.perf_counter() - start) * 1000)

        if response.status_code == 200:
            return TestLlmResponse(
                success=True,
                message=f"LLM 连接成功（模型 {model_name}）",
                latency_ms=latency_ms,
            )

        detail = response.text[:200] if response.text else response.reason_phrase
        return TestLlmResponse(
            success=False,
            message=f"连接失败（HTTP {response.status_code}）：{detail}",
            latency_ms=latency_ms,
        )
    except httpx.TimeoutException:
        return TestLlmResponse(success=False, message="连接超时，请检查 API Base URL 与网络")
    except httpx.RequestError as exc:
        return TestLlmResponse(success=False, message=f"连接失败：{exc}")
