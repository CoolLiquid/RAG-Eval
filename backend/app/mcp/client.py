from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import TypeVar
from urllib.parse import urlparse

import httpx
from mcp import types
from mcp.client.session import ClientSession
from mcp.client.sse import sse_client
from mcp.client.streamable_http import streamable_http_client
from mcp.shared._httpx_utils import create_mcp_http_client

from app.core.config import settings
from app.mcp.adapters.chunk_adapter import adapt_search_response
from app.mcp.exceptions import McpAuthError, McpClientError, McpConnectionError, McpToolError
from app.schemas.auth import AuthType, build_auth_headers
from app.schemas.kb import ChunkResponse, ToolInfo

logger = logging.getLogger(__name__)

T = TypeVar("T")

CLIENT_INFO = types.Implementation(name="kb-eval-platform", version=settings.app_version)


def _should_use_mock(endpoint: str) -> bool:
    hostname = (urlparse(endpoint.strip()).hostname or "").lower()
    mock_domains = [domain.lower() for domain in settings.mcp_mock_domains]
    return any(hostname == domain or hostname.endswith(f".{domain}") for domain in mock_domains)


def _map_http_error(exc: httpx.HTTPStatusError) -> McpClientError:
    status = exc.response.status_code
    if status in (401, 403):
        return McpAuthError("鉴权失败，请检查密钥或 Header 配置")
    if status == 404:
        return McpConnectionError("MCP Endpoint 不存在，请检查 URL")
    return McpConnectionError(f"MCP Server 返回 HTTP {status}")


def _unwrap_exception(exc: Exception) -> Exception:
    if isinstance(exc, BaseExceptionGroup):
        for sub in exc.exceptions:
            if isinstance(sub, Exception):
                return _unwrap_exception(sub)
    return exc


def _map_exception(exc: Exception) -> McpClientError:
    exc = _unwrap_exception(exc)
    if isinstance(exc, McpClientError):
        return exc
    if isinstance(exc, httpx.HTTPStatusError):
        return _map_http_error(exc)
    if isinstance(exc, httpx.TimeoutException):
        return McpConnectionError("连接 MCP Server 超时，请稍后重试")
    if isinstance(exc, httpx.RequestError):
        return McpConnectionError(f"无法连接到 MCP Server：{exc}")
    return McpConnectionError(str(exc) or "MCP 连接失败")


async def _with_session(
    endpoint: str,
    auth_type: AuthType,
    auth_secret: str,
    auth_header_name: str | None,
    operation: Callable[[ClientSession], Awaitable[T]],
) -> T:
    headers = build_auth_headers(auth_type, auth_secret, auth_header_name)
    timeout = httpx.Timeout(
        settings.mcp_connect_timeout_seconds,
        read=settings.mcp_read_timeout_seconds,
    )
    errors: list[McpClientError] = []

    for transport in ("streamable", "sse"):
        try:
            return await _run_transport(
                transport=transport,
                endpoint=endpoint,
                headers=headers,
                timeout=timeout,
                operation=operation,
            )
        except Exception as exc:
            mapped = _map_exception(exc)
            logger.warning(
                "MCP transport %s failed for %s: %s",
                transport,
                endpoint,
                mapped.message,
            )
            errors.append(mapped)

    if any(isinstance(err, McpAuthError) for err in errors):
        raise McpAuthError("鉴权失败，请检查密钥或 Header 配置")

    if errors:
        raise errors[-1]
    raise McpConnectionError("无法连接到 MCP Server")


async def _run_transport(
    *,
    transport: str,
    endpoint: str,
    headers: dict[str, str],
    timeout: httpx.Timeout,
    operation: Callable[[ClientSession], Awaitable[T]],
) -> T:
    if transport == "streamable":
        async with create_mcp_http_client(headers=headers, timeout=timeout) as http_client:
            async with streamable_http_client(endpoint, http_client=http_client) as streams:
                read_stream, write_stream, _get_session_id = streams
                async with ClientSession(
                    read_stream,
                    write_stream,
                    client_info=CLIENT_INFO,
                ) as session:
                    await session.initialize()
                    return await operation(session)

    async with sse_client(
        endpoint,
        headers=headers,
        timeout=timeout.connect or settings.mcp_connect_timeout_seconds,
        sse_read_timeout=timeout.read or settings.mcp_read_timeout_seconds,
    ) as streams:
        read_stream, write_stream = streams
        async with ClientSession(
            read_stream,
            write_stream,
            client_info=CLIENT_INFO,
        ) as session:
            await session.initialize()
            return await operation(session)


async def test_connection(
    *,
    endpoint: str,
    auth_type: AuthType,
    auth_secret: str,
    auth_header_name: str | None,
) -> tuple[bool, str, int]:
    async def _op(session: ClientSession) -> int:
        tools = await session.list_tools()
        return len(tools.tools)

    tool_count = await _with_retry(
        lambda: _with_session(endpoint, auth_type, auth_secret, auth_header_name, _op)
    )
    return True, "连接成功", tool_count


async def discover_tools(
    *,
    endpoint: str,
    auth_type: AuthType,
    auth_secret: str,
    auth_header_name: str | None,
) -> list[ToolInfo]:
    async def _op(session: ClientSession) -> list[ToolInfo]:
        result = await session.list_tools()
        return [
            ToolInfo(
                name=tool.name,
                description=tool.description or "",
            )
            for tool in result.tools
        ]

    return await _with_retry(
        lambda: _with_session(endpoint, auth_type, auth_secret, auth_header_name, _op)
    )


async def trial_search(
    *,
    endpoint: str,
    auth_type: AuthType,
    auth_secret: str,
    auth_header_name: str | None,
    tool_name: str,
    query: str,
    top_k: int,
) -> list[ChunkResponse]:
    async def _op(session: ClientSession) -> list[ChunkResponse]:
        result = await session.call_tool(
            tool_name,
            arguments={"query": query, "top_k": top_k},
        )
        return adapt_search_response(result)

    return await _with_retry(
        lambda: _with_session(endpoint, auth_type, auth_secret, auth_header_name, _op)
    )


async def _with_retry(factory: Callable[[], Awaitable[T]]) -> T:
    last_error: McpClientError | None = None
    attempts = max(1, settings.mcp_retry_attempts)
    for attempt in range(attempts):
        try:
            return await factory()
        except McpAuthError:
            raise
        except McpToolError:
            raise
        except McpClientError as exc:
            last_error = exc
            if attempt + 1 >= attempts:
                break
            await asyncio.sleep(0.5)
    if last_error:
        raise last_error
    raise McpConnectionError("MCP 调用失败")


def run_mcp(coro: Awaitable[T]) -> T:
    return asyncio.run(coro)


def should_use_mock(endpoint: str) -> bool:
    return settings.mcp_mock_enabled and _should_use_mock(endpoint)
