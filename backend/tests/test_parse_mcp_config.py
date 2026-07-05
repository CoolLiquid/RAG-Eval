import pytest

from app.mcp.parse_config import build_mcp_config_json, parse_mcp_config


def test_cursor_mcp_servers_format():
    raw = {
        "mcpServers": {
            "stitch": {
                "url": "https://stitch.googleapis.com/mcp",
                "headers": {"X-Goog-Api-Key": "test-key"},
            }
        }
    }
    result = parse_mcp_config(raw)
    assert result.endpoint == "https://stitch.googleapis.com/mcp"
    assert result.auth_type == "custom_header"
    assert result.auth_header_name == "X-Goog-Api-Key"
    assert result.auth_secret == "test-key"
    assert result.server_name == "stitch"
    assert not result.needs_server_selection


def test_single_server_object():
    raw = {
        "url": "https://example.com/mcp",
        "headers": {"Authorization": "Bearer my-token"},
    }
    result = parse_mcp_config(raw)
    assert result.endpoint == "https://example.com/mcp"
    assert result.auth_type == "bearer"
    assert result.auth_secret == "my-token"


def test_servers_legacy_format():
    raw = {
        "servers": {
            "docs": {
                "type": "http",
                "url": "https://example.com/api/mcp/sse",
                "headers": {"X-API-Key": "key123"},
            }
        }
    }
    result = parse_mcp_config(raw)
    assert result.endpoint == "https://example.com/api/mcp/sse"
    assert result.auth_type == "api_key"
    assert result.auth_header_name == "X-API-Key"
    assert result.auth_secret == "key123"


def test_bearer_auth():
    raw = {
        "url": "https://example.com/mcp",
        "headers": {"Authorization": "Bearer tok"},
    }
    result = parse_mcp_config(raw)
    assert result.auth_type == "bearer"
    assert result.auth_secret == "tok"


def test_api_key_authorization_header():
    raw = {
        "url": "https://example.com/mcp",
        "headers": {"Authorization": "ApiKey secret"},
    }
    result = parse_mcp_config(raw)
    assert result.auth_type == "authorization_api_key"
    assert result.auth_secret == "secret"


def test_no_auth():
    raw = {"url": "https://example.com/mcp"}
    result = parse_mcp_config(raw)
    assert result.auth_type == "none"
    assert result.auth_secret == ""


def test_reject_stdio():
    raw = {
        "mcpServers": {
            "local": {
                "command": "npx",
                "args": ["-y", "some-mcp"],
            }
        }
    }
    with pytest.raises(ValueError, match="stdio"):
        parse_mcp_config(raw, server_name="local")


def test_reject_oauth():
    raw = {
        "url": "https://example.com/mcp",
        "auth": {"CLIENT_ID": "id"},
    }
    with pytest.raises(ValueError, match="OAuth"):
        parse_mcp_config(raw)


def test_multiple_servers_needs_selection():
    raw = {
        "mcpServers": {
            "a": {"url": "https://a.example.com/mcp"},
            "b": {"url": "https://b.example.com/mcp"},
        }
    }
    result = parse_mcp_config(raw)
    assert result.needs_server_selection is True
    assert set(result.available_servers) == {"a", "b"}
    assert result.endpoint is None


def test_multiple_servers_with_name():
    raw = {
        "mcpServers": {
            "a": {"url": "https://a.example.com/mcp"},
            "b": {"url": "https://b.example.com/mcp", "headers": {"X-API-Key": "k"}},
        }
    }
    result = parse_mcp_config(raw, server_name="b")
    assert result.endpoint == "https://b.example.com/mcp"
    assert result.server_name == "b"


def test_env_placeholder_warning():
    raw = {
        "url": "https://example.com/mcp",
        "headers": {"Authorization": "Bearer ${env:MY_TOKEN}"},
    }
    result = parse_mcp_config(raw)
    assert result.has_env_placeholder is True
    assert any("环境变量" in w for w in result.warnings)


def test_build_mcp_config_json():
    config = build_mcp_config_json(
        "https://example.com/mcp",
        "bearer",
        None,
        auth_secret_masked="••••abcd",
    )
    assert config["mcpServers"]["default"]["url"] == "https://example.com/mcp"
    assert config["mcpServers"]["default"]["headers"]["Authorization"] == "Bearer ••••abcd"
