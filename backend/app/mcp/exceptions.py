from __future__ import annotations


class McpClientError(Exception):
    """Base MCP client error."""

    code: str = "mcp_error"

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code


class McpAuthError(McpClientError):
    code = "AUTH_FAILED"


class McpConnectionError(McpClientError):
    code = "TIMEOUT"


class McpToolError(McpClientError):
    code = "TOOL_NOT_FOUND"


class McpMappingError(McpClientError):
    code = "mapping_error"
