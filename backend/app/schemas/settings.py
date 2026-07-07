from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.evaluation import ScoringMethod

LlmModelName = Literal[
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4-turbo",
    "deepseek-chat",
    "qwen-plus",
]


class LlmConfigPublic(BaseModel):
    api_base_url: str
    model_name: LlmModelName
    api_key_configured: bool
    api_key_masked: str | None = None


class EvaluationDefaults(BaseModel):
    top_k: int = Field(default=5, ge=1, le=50)
    pass_threshold: float = Field(default=70, ge=0, le=100)
    mcp_timeout_ms: int = Field(default=30000, ge=1000, le=120000)
    scoring_method: ScoringMethod = "llm_judge"


class SettingsResponse(BaseModel):
    llm: LlmConfigPublic
    evaluation_defaults: EvaluationDefaults
    updated_at: datetime | None = None


class LlmConfigUpdate(BaseModel):
    api_base_url: str | None = None
    model_name: LlmModelName | None = None
    api_key: str | None = None


class SettingsUpdate(BaseModel):
    llm: LlmConfigUpdate | None = None
    evaluation_defaults: EvaluationDefaults | None = None


class TestLlmRequest(BaseModel):
    api_base_url: str | None = None
    model_name: LlmModelName | None = None
    api_key: str | None = None


class TestLlmResponse(BaseModel):
    success: bool
    message: str
    latency_ms: int | None = None
