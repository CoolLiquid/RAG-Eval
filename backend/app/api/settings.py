from fastapi import APIRouter, HTTPException

from app.schemas.settings import (
    SettingsResponse,
    SettingsUpdate,
    TestLlmRequest,
    TestLlmResponse,
)
from app.services import settings_service

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_settings() -> SettingsResponse:
    return settings_service.get_settings()


@router.put("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate) -> SettingsResponse:
    try:
        return settings_service.update_settings(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/test-llm", response_model=TestLlmResponse)
def test_llm_connection(data: TestLlmRequest | None = None) -> TestLlmResponse:
    return settings_service.test_llm_connection(data)
