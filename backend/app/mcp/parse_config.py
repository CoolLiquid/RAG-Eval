from __future__ import annotations

import re
from dataclasses import dataclass, field
from urllib.parse import urlparse

from app.schemas.auth import AuthType, build_auth_headers, validate_auth_config

ENV_PLACEHOLDER_PATTERN = re.compile(r"\$\{(?:env|userHome|workspaceFolder|pathSeparator)[^}]*\}")
STDIO_KEYS = frozenset({"command", "args", "env", "envFile"})


@dataclass
class ParsedMcpConfig:
    endpoint: str | None = None
    auth_type: AuthType | None = None
    auth_header_name: str | None = None
    auth_secret: str = ""
    server_name: str | None = None
    available_servers: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    normalized_config: dict = field(default_factory=dict)
    needs_server_selection: bool = False
    has_env_placeholder: bool = False


def _validate_endpoint(endpoint: str) -> str:
    parsed = urlparse(endpoint.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("Endpoint 必须是有效的 http(s) URL")
    return endpoint.strip()


def _extract_servers_map(raw: dict) -> tuple[dict[str, dict], str | None]:
    if "mcpServers" in raw and isinstance(raw["mcpServers"], dict):
        servers = {k: v for k, v in raw["mcpServers"].items() if isinstance(v, dict)}
        return servers, "mcpServers"
    if "servers" in raw and isinstance(raw["servers"], dict):
        servers = {k: v for k, v in raw["servers"].items() if isinstance(v, dict)}
        return servers, "servers"
    if "url" in raw:
        return {"__single__": raw}, "__single__"
    return {}, None


def _resolve_server_entry(
    raw: dict,
    server_name: str | None,
) -> tuple[str, dict]:
    servers, container = _extract_servers_map(raw)

    if not servers:
        raise ValueError("无法识别 MCP 配置格式，请提供 url 或 mcpServers 结构")

    if container == "__single__":
        return server_name or "default", servers["__single__"]

    names = sorted(servers.keys())
    if len(names) > 1 and not server_name:
        return "", {}

    name = server_name or names[0]
    if name not in servers:
        raise ValueError(f"未找到名为「{name}」的 MCP Server，可用：{', '.join(names)}")

    return name, servers[name]


def _reject_stdio(entry: dict) -> None:
    has_url = bool(entry.get("url"))
    has_stdio = any(entry.get(key) for key in STDIO_KEYS)
    if has_stdio and not has_url:
        raise ValueError("本平台仅支持远程 URL MCP，不支持本地 stdio（command/args）")


def _reject_oauth(entry: dict) -> None:
    if entry.get("auth") and isinstance(entry["auth"], dict):
        raise ValueError("OAuth 配置暂不支持，请改用 headers 传递鉴权信息")


def _infer_auth_from_headers(headers: dict[str, str]) -> tuple[AuthType, str | None, str, list[str]]:
    warnings: list[str] = []
    if not headers:
        return "none", None, "", warnings

    normalized = {k.strip(): v.strip() for k, v in headers.items() if k and v is not None}

    if "Authorization" in normalized:
        value = normalized["Authorization"]
        bearer_prefix = "Bearer "
        api_key_prefix = "ApiKey "
        if value.startswith(bearer_prefix):
            return "bearer", None, value[len(bearer_prefix) :], warnings
        if value.startswith(api_key_prefix):
            return "authorization_api_key", None, value[len(api_key_prefix) :], warnings
        warnings.append("Authorization Header 格式未识别，已按 Bearer 处理")
        return "bearer", None, value, warnings

    if len(normalized) == 1:
        header_name, secret = next(iter(normalized.items()))
        if header_name.lower() == "x-api-key":
            return "api_key", header_name, secret, warnings
        return "custom_header", header_name, secret, warnings

    if len(normalized) > 1:
        warnings.append("检测到多个 Header，已优先使用 Authorization 或第一个 Header")
        if "Authorization" in normalized:
            return _infer_auth_from_headers({"Authorization": normalized["Authorization"]})
        header_name, secret = next(iter(normalized.items()))
        if header_name.lower() == "x-api-key":
            return "api_key", header_name, secret, warnings
        return "custom_header", header_name, secret, warnings

    return "none", None, "", warnings


def _check_env_placeholders(secret: str, headers: dict[str, str]) -> tuple[bool, list[str]]:
    warnings: list[str] = []
    has_placeholder = False
    for value in [secret, *headers.values()]:
        if ENV_PLACEHOLDER_PATTERN.search(value):
            has_placeholder = True
            warnings.append("检测到环境变量占位符（如 ${env:VAR}），请替换为实际密钥后再测试连接")
            break
    return has_placeholder, warnings


def _build_normalized_config(endpoint: str, headers: dict[str, str]) -> dict:
    server: dict = {"url": endpoint}
    if headers:
        server["headers"] = headers
    return {"mcpServers": {"default": server}}


def parse_mcp_config(raw: dict, server_name: str | None = None) -> ParsedMcpConfig:
    if not isinstance(raw, dict):
        raise ValueError("配置必须是 JSON 对象")

    servers, container = _extract_servers_map(raw)
    if container not in (None, "__single__") and len(servers) > 1 and not server_name:
        return ParsedMcpConfig(
            available_servers=sorted(servers.keys()),
            needs_server_selection=True,
            warnings=["检测到多个 MCP Server，请选择要挂载的实例"],
        )

    resolved_name, entry = _resolve_server_entry(raw, server_name)
    if not entry:
        return ParsedMcpConfig(
            available_servers=sorted(servers.keys()),
            needs_server_selection=True,
            warnings=["检测到多个 MCP Server，请选择要挂载的实例"],
        )

    _reject_stdio(entry)
    _reject_oauth(entry)

    url = entry.get("url")
    if not url or not isinstance(url, str):
        raise ValueError("MCP 配置缺少有效的 url 字段")

    endpoint = _validate_endpoint(url)
    raw_headers = entry.get("headers") or {}
    if not isinstance(raw_headers, dict):
        raise ValueError("headers 必须是对象")

    headers = {str(k): str(v) for k, v in raw_headers.items()}
    auth_type, auth_header_name, auth_secret, infer_warnings = _infer_auth_from_headers(headers)

    has_env_placeholder, env_warnings = _check_env_placeholders(auth_secret, headers)
    all_warnings = infer_warnings + env_warnings

    if auth_type != "none" and not has_env_placeholder:
        validate_auth_config(auth_type, auth_secret, auth_header_name)

    display_name = resolved_name if resolved_name != "__single__" else (server_name or "default")

    return ParsedMcpConfig(
        endpoint=endpoint,
        auth_type=auth_type,
        auth_header_name=auth_header_name,
        auth_secret=auth_secret,
        server_name=display_name,
        warnings=all_warnings,
        normalized_config=_build_normalized_config(endpoint, headers),
        has_env_placeholder=has_env_placeholder,
    )


def build_mcp_config_json(
    endpoint: str,
    auth_type: AuthType,
    auth_header_name: str | None,
    auth_secret: str = "",
    auth_secret_masked: str = "••••••••",
    server_name: str = "default",
) -> dict:
    secret_for_display = auth_secret if auth_secret and auth_secret != "********" else auth_secret_masked
    headers = build_auth_headers(auth_type, secret_for_display, auth_header_name)

    server: dict = {"url": endpoint}
    if headers:
        server["headers"] = headers

    return {"mcpServers": {server_name: server}}
