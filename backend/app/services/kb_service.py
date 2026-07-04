from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.parse import urlparse

from app.mcp.client import (
    discover_tools as mcp_discover_tools,
    run_mcp,
    should_use_mock,
    test_connection as mcp_test_connection,
    trial_search as mcp_trial_search,
)
from app.schemas.auth import format_auth_display, validate_auth_config
from app.schemas.kb import (
    AuthType,
    ChunkResponse,
    DiscoverToolsResponse,
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
    KnowledgeBaseUpdate,
    KbStatus,
    TestConnectionResponse,
    ToolInfo,
    TrialSearchResponse,
)
from app.mcp.exceptions import McpAuthError, McpClientError

MOCK_TOOLS: list[ToolInfo] = [
    ToolInfo(name="kb_search", description="根据问题检索知识库，返回相关文本片段"),
    ToolInfo(name="kb_health", description="检查 MCP 知识库服务健康状态"),
]

MOCK_CHUNKS: list[ChunkResponse] = [
    ChunkResponse(
        content="自签收之日起7天内，用户可无理由申请退货，商品需保持原包装完好。",
        source="doc://after-sales-policy/v2.3#section-3",
        title="售后政策 - 退货条款",
        score=0.92,
    ),
    ChunkResponse(
        content="退款将在仓库验收通过后 3-5 个工作日内原路退回。",
        source="doc://after-sales-policy/v2.3#section-4",
        title="售后政策 - 退款流程",
        score=0.87,
    ),
    ChunkResponse(
        content="特殊商品（定制类、鲜活易腐类）不支持无理由退货。",
        source="doc://after-sales-policy/v2.3#section-5",
        title="售后政策 - 例外情况",
        score=0.71,
    ),
]


@dataclass
class KnowledgeBaseRecord:
    id: str
    name: str
    endpoint: str
    auth_type: AuthType
    auth_header_name: str | None
    auth_secret: str
    retrieval_tool: str | None
    status: KbStatus
    last_tested_at: datetime | None
    created_at: datetime


@dataclass
class KnowledgeBaseStore:
    records: dict[str, KnowledgeBaseRecord] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.records:
            self._seed_demo_data()

    def _seed_demo_data(self) -> None:
        now = datetime.now(timezone.utc)
        demos = [
            KnowledgeBaseRecord(
                id="kb-demo-001",
                name="售后知识库",
                endpoint="https://mcp.example.com/sales",
                auth_type="api_key",
                auth_header_name=None,
                auth_secret="demo-key-sales",
                retrieval_tool="kb_search",
                status="connected",
                last_tested_at=now,
                created_at=now,
            ),
            KnowledgeBaseRecord(
                id="kb-demo-002",
                name="产品文档库",
                endpoint="https://mcp.example.com/product-docs",
                auth_type="bearer",
                auth_header_name=None,
                auth_secret="demo-bearer-token",
                retrieval_tool="kb_search",
                status="failed",
                last_tested_at=now,
                created_at=now,
            ),
        ]
        for record in demos:
            self.records[record.id] = record


store = KnowledgeBaseStore()


def _mask_secret(secret: str) -> str:
    if not secret:
        return "—"
    if len(secret) <= 4:
        return "••••"
    return "••••" + secret[-4:]


def _validate_endpoint(endpoint: str) -> bool:
    parsed = urlparse(endpoint.strip())
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def _normalize_header_name(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _to_response(record: KnowledgeBaseRecord) -> KnowledgeBaseResponse:
    masked = _mask_secret(record.auth_secret)
    return KnowledgeBaseResponse(
        id=record.id,
        name=record.name,
        endpoint=record.endpoint,
        auth_type=record.auth_type,
        auth_header_name=record.auth_header_name,
        auth_secret_masked=masked,
        auth_display=format_auth_display(record.auth_type, masked, record.auth_header_name),
        retrieval_tool=record.retrieval_tool,
        status=record.status,
        last_tested_at=record.last_tested_at,
        created_at=record.created_at,
    )


def list_knowledge_bases(
    search: str | None = None,
    status: KbStatus | None = None,
) -> tuple[list[KnowledgeBaseResponse], int]:
    items = [_to_response(r) for r in store.records.values()]
    if search:
        keyword = search.lower()
        items = [
            item
            for item in items
            if keyword in item.name.lower() or keyword in item.endpoint.lower()
        ]
    if status:
        items = [item for item in items if item.status == status]
    items.sort(key=lambda x: x.created_at, reverse=True)
    return items, len(items)


def get_knowledge_base(kb_id: str) -> KnowledgeBaseResponse | None:
    record = store.records.get(kb_id)
    if not record:
        return None
    return _to_response(record)


def create_knowledge_base(data: KnowledgeBaseCreate) -> KnowledgeBaseResponse:
    if not _validate_endpoint(data.endpoint):
        raise ValueError("Endpoint 必须是有效的 http(s) URL")

    auth_header_name = _normalize_header_name(data.auth_header_name)
    validate_auth_config(data.auth_type, data.auth_secret, auth_header_name)

    now = datetime.now(timezone.utc)
    record = KnowledgeBaseRecord(
        id=f"kb-{uuid.uuid4().hex[:12]}",
        name=data.name.strip(),
        endpoint=data.endpoint.strip(),
        auth_type=data.auth_type,
        auth_header_name=auth_header_name,
        auth_secret=data.auth_secret.strip(),
        retrieval_tool=data.retrieval_tool,
        status="pending",
        last_tested_at=None,
        created_at=now,
    )
    store.records[record.id] = record
    return _to_response(record)


def update_knowledge_base(
    kb_id: str, data: KnowledgeBaseUpdate
) -> KnowledgeBaseResponse | None:
    record = store.records.get(kb_id)
    if not record:
        return None

    if data.name is not None:
        record.name = data.name.strip()
    if data.endpoint is not None:
        if not _validate_endpoint(data.endpoint):
            raise ValueError("Endpoint 必须是有效的 http(s) URL")
        record.endpoint = data.endpoint.strip()
    if data.auth_type is not None:
        record.auth_type = data.auth_type
    if data.auth_header_name is not None:
        record.auth_header_name = _normalize_header_name(data.auth_header_name)
    if data.auth_secret is not None:
        record.auth_secret = data.auth_secret.strip()
    if data.retrieval_tool is not None:
        record.retrieval_tool = data.retrieval_tool
    if data.status is not None:
        record.status = data.status

    validate_auth_config(record.auth_type, record.auth_secret, record.auth_header_name)

    return _to_response(record)


def delete_knowledge_base(kb_id: str) -> bool:
    if kb_id not in store.records:
        return False
    del store.records[kb_id]
    return True


def _record_connection_params(record: KnowledgeBaseRecord) -> dict:
    return {
        "endpoint": record.endpoint,
        "auth_type": record.auth_type,
        "auth_secret": record.auth_secret,
        "auth_header_name": record.auth_header_name,
    }


def _mock_test_connection(record: KnowledgeBaseRecord) -> TestConnectionResponse:
    if re.search(r"fail|error|invalid", record.endpoint, re.IGNORECASE):
        record.status = "failed"
        return TestConnectionResponse(
            success=False,
            status="failed",
            message="无法连接到 MCP Server，请检查 Endpoint 与鉴权信息",
        )
    record.status = "connected"
    return TestConnectionResponse(
        success=True,
        status="connected",
        message="连接成功（演示 Mock）",
        tools_count=len(MOCK_TOOLS),
    )


def test_connection(kb_id: str) -> TestConnectionResponse | None:
    record = store.records.get(kb_id)
    if not record:
        return None

    now = datetime.now(timezone.utc)
    record.last_tested_at = now

    if not _validate_endpoint(record.endpoint):
        record.status = "failed"
        return TestConnectionResponse(
            success=False,
            status="failed",
            message="Endpoint URL 格式无效",
        )

    if should_use_mock(record.endpoint):
        return _mock_test_connection(record)

    try:
        success, message, tools_count = run_mcp(
            mcp_test_connection(**_record_connection_params(record))
        )
        record.status = "connected" if success else "failed"
        return TestConnectionResponse(
            success=success,
            status=record.status,
            message=message,
            tools_count=tools_count,
        )
    except McpAuthError as exc:
        record.status = "failed"
        return TestConnectionResponse(
            success=False,
            status="failed",
            message=exc.message,
        )
    except McpClientError as exc:
        record.status = "failed"
        return TestConnectionResponse(
            success=False,
            status="failed",
            message=exc.message,
        )


def discover_tools(kb_id: str) -> DiscoverToolsResponse | None:
    record = store.records.get(kb_id)
    if not record:
        return None
    if record.status != "connected":
        raise ValueError("请先测试连接成功后再发现 Tools")

    if should_use_mock(record.endpoint):
        return DiscoverToolsResponse(tools=MOCK_TOOLS)

    try:
        tools = run_mcp(mcp_discover_tools(**_record_connection_params(record)))
        return DiscoverToolsResponse(tools=tools)
    except McpClientError as exc:
        raise ValueError(exc.message) from exc


def trial_search(kb_id: str, query: str, top_k: int = 5) -> TrialSearchResponse | None:
    record = store.records.get(kb_id)
    if not record:
        return None
    if not record.retrieval_tool:
        raise ValueError("请先选择检索 Tool")

    if should_use_mock(record.endpoint):
        if "无结果" in query or "empty" in query.lower():
            return TrialSearchResponse(chunks=[], count=0)
        chunks = MOCK_CHUNKS[:top_k]
        return TrialSearchResponse(chunks=chunks, count=len(chunks))

    try:
        chunks = run_mcp(
            mcp_trial_search(
                **_record_connection_params(record),
                tool_name=record.retrieval_tool,
                query=query,
                top_k=top_k,
            )
        )
        return TrialSearchResponse(chunks=chunks, count=len(chunks))
    except McpClientError as exc:
        raise ValueError(exc.message) from exc
