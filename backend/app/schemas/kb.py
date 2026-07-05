from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.auth import AuthType, validate_auth_config

KbStatus = Literal["connected", "failed", "pending", "disabled"]


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    endpoint: str = Field(min_length=1)
    auth_type: AuthType = "api_key"
    auth_header_name: str | None = None
    auth_secret: str = ""
    retrieval_tool: str | None = None

    @model_validator(mode="after")
    def validate_auth(self) -> KnowledgeBaseCreate:
        validate_auth_config(self.auth_type, self.auth_secret, self.auth_header_name)
        return self


class KnowledgeBaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    endpoint: str | None = Field(default=None, min_length=1)
    auth_type: AuthType | None = None
    auth_header_name: str | None = None
    auth_secret: str | None = None
    retrieval_tool: str | None = None
    status: KbStatus | None = None


class KnowledgeBaseResponse(BaseModel):
    id: str
    name: str
    endpoint: str
    auth_type: AuthType
    auth_header_name: str | None
    auth_secret_masked: str
    auth_display: str
    retrieval_tool: str | None
    status: KbStatus
    last_tested_at: datetime | None
    created_at: datetime


class KnowledgeBaseListResponse(BaseModel):
    items: list[KnowledgeBaseResponse]
    total: int


class ToolInfo(BaseModel):
    name: str
    description: str


class DiscoverToolsResponse(BaseModel):
    tools: list[ToolInfo]


class TestConnectionResponse(BaseModel):
    success: bool
    status: KbStatus
    message: str
    tools_count: int | None = None


class TrialSearchRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)


class ChunkResponse(BaseModel):
    content: str
    source: str
    title: str | None = None
    score: float | None = None


class TrialSearchResponse(BaseModel):
    chunks: list[ChunkResponse]
    count: int


class ParseMcpConfigRequest(BaseModel):
    config: dict
    server_name: str | None = None


class ParseMcpConfigResponse(BaseModel):
    endpoint: str | None = None
    auth_type: AuthType | None = None
    auth_header_name: str | None = None
    auth_secret: str = ""
    server_name: str | None = None
    available_servers: list[str] = []
    warnings: list[str] = []
    normalized_config: dict = {}
    needs_server_selection: bool = False
    has_env_placeholder: bool = False
