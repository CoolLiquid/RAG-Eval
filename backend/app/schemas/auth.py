from __future__ import annotations

import re
from typing import Literal

AuthType = Literal[
    "none",
    "api_key",
    "authorization_api_key",
    "bearer",
    "custom_header",
]

HEADER_NAME_PATTERN = re.compile(r"^[A-Za-z0-9-]+$")

AUTH_TYPE_LABELS: dict[AuthType, str] = {
    "none": "无鉴权",
    "api_key": "API Key (X-API-Key)",
    "authorization_api_key": "API Key (Authorization: ApiKey)",
    "bearer": "Bearer Token",
    "custom_header": "自定义 Header",
}


def validate_auth_header_name(name: str) -> None:
    if not name or not name.strip():
        raise ValueError("自定义 Header 名称不能为空")
    if not HEADER_NAME_PATTERN.match(name.strip()):
        raise ValueError("Header 名称仅允许字母、数字和连字符")


def validate_auth_config(
    auth_type: AuthType,
    auth_secret: str,
    auth_header_name: str | None,
) -> None:
    if auth_type == "custom_header":
        if not auth_header_name:
            raise ValueError("自定义 Header 鉴权必须填写 Header 名称")
        validate_auth_header_name(auth_header_name)
    elif auth_header_name:
        validate_auth_header_name(auth_header_name)

    if auth_type != "none" and not auth_secret.strip():
        raise ValueError("请填写密钥或 Token")


def build_auth_headers(
    auth_type: AuthType,
    auth_secret: str,
    auth_header_name: str | None = None,
) -> dict[str, str]:
    """Build HTTP headers for MCP requests based on stored auth config."""
    if auth_type == "none":
        return {}

    secret = auth_secret.strip()
    if auth_type == "api_key":
        header = (auth_header_name or "X-API-Key").strip()
        return {header: secret}
    if auth_type == "authorization_api_key":
        return {"Authorization": f"ApiKey {secret}"}
    if auth_type == "bearer":
        return {"Authorization": f"Bearer {secret}"}
    if auth_type == "custom_header":
        header = (auth_header_name or "").strip()
        return {header: secret}

    return {}


def format_auth_display(
    auth_type: AuthType,
    auth_secret_masked: str,
    auth_header_name: str | None = None,
) -> str:
    if auth_type == "none":
        return "无鉴权"

    if auth_type == "api_key":
        header = auth_header_name or "X-API-Key"
        return f"{header} · {auth_secret_masked}"
    if auth_type == "authorization_api_key":
        return f"Authorization: ApiKey · {auth_secret_masked}"
    if auth_type == "bearer":
        return f"Authorization: Bearer · {auth_secret_masked}"
    if auth_type == "custom_header" and auth_header_name:
        return f"{auth_header_name} · {auth_secret_masked}"

    return auth_secret_masked
