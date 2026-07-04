from __future__ import annotations

import json
from typing import Any

from mcp.types import CallToolResult

from app.mcp.exceptions import McpMappingError
from app.schemas.kb import ChunkResponse


def _coerce_score(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _item_to_chunk(item: dict[str, Any]) -> ChunkResponse | None:
    content = (
        item.get("content")
        or item.get("text")
        or item.get("snippet")
        or item.get("body")
        or ""
    )
    source = item.get("source") or item.get("doc_id") or item.get("url") or item.get("id") or ""
    if not str(content).strip():
        return None
    return ChunkResponse(
        content=str(content),
        source=str(source or "unknown"),
        title=item.get("title"),
        score=_coerce_score(item.get("score") or item.get("similarity") or item.get("relevance")),
    )


def _extract_results(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]

    if not isinstance(payload, dict):
        return []

    for key in ("results", "chunks", "items", "data"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            nested = value.get("chunks") or value.get("items") or value.get("results")
            if isinstance(nested, list):
                return [item for item in nested if isinstance(item, dict)]

    return []


def parse_tool_result(result: CallToolResult) -> list[ChunkResponse]:
    payload = extract_result_payload(result)
    raw_items = _extract_results(payload)
    chunks = [chunk for item in raw_items if (chunk := _item_to_chunk(item)) is not None]
    return chunks


def extract_result_payload(result: CallToolResult) -> Any:
    if result.structuredContent is not None:
        return result.structuredContent

    texts: list[str] = []
    for block in result.content:
        text = getattr(block, "text", None)
        if text:
            texts.append(text)

    if not texts:
        return {}

    combined = "\n".join(texts).strip()
    if not combined:
        return {}

    try:
        return json.loads(combined)
    except json.JSONDecodeError as exc:
        return {
            "results": [
                {
                    "content": combined,
                    "source": "inline",
                }
            ]
        }


def adapt_search_response(result: CallToolResult) -> list[ChunkResponse]:
    if result.isError:
        message = _error_message(result)
        raise McpMappingError(message or "MCP Tool 执行失败")

    chunks = parse_tool_result(result)
    return chunks


def _error_message(result: CallToolResult) -> str:
    for block in result.content:
        text = getattr(block, "text", None)
        if text:
            return text
    return "MCP Tool 返回错误"
