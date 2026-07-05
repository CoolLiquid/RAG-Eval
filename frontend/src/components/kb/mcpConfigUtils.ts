import type { AuthType, ParseMcpConfigResponse } from '@/types/kb';

export const DEFAULT_MCP_CONFIG_TEMPLATE = `{
  "mcpServers": {
    "default": {
      "url": "https://your-domain.com/mcp",
      "headers": {
        "X-API-Key": "your-api-key"
      }
    }
  }
}`;

export function parseJsonSafe(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    const value = JSON.parse(text);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { ok: false, error: '配置必须是 JSON 对象' };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, error: 'JSON 格式无效，请检查语法' };
  }
}

export function buildHeadersFromAuth(
  authType: AuthType,
  authSecret: string,
  authHeaderName?: string | null,
): Record<string, string> {
  const secret = authSecret.trim();
  if (authType === 'none' || !secret) return {};

  switch (authType) {
    case 'api_key':
      return { [authHeaderName?.trim() || 'X-API-Key']: secret };
    case 'authorization_api_key':
      return { Authorization: `ApiKey ${secret}` };
    case 'bearer':
      return { Authorization: `Bearer ${secret}` };
    case 'custom_header':
      return authHeaderName?.trim() ? { [authHeaderName.trim()]: secret } : {};
    default:
      return {};
  }
}

export function buildMcpConfigJsonFromForm(
  endpoint: string,
  authType: AuthType,
  authHeaderName?: string | null,
  maskedSecret = '••••••••',
  serverName = 'default',
): string {
  const headers = buildHeadersFromAuth(authType, maskedSecret, authHeaderName);
  const server: Record<string, unknown> = { url: endpoint };
  if (Object.keys(headers).length > 0) {
    server.headers = headers;
  }
  return JSON.stringify({ mcpServers: { [serverName]: server } }, null, 2);
}

export interface ParsedFormFields {
  endpoint: string;
  auth_type: AuthType;
  auth_header_name?: string;
  auth_secret?: string;
}

export function applyParseResultToForm(
  result: ParseMcpConfigResponse,
  secretOverride?: string,
): ParsedFormFields | null {
  if (result.needs_server_selection || !result.endpoint || !result.auth_type) {
    return null;
  }

  const secret = secretOverride?.trim() || result.auth_secret;
  return {
    endpoint: result.endpoint,
    auth_type: result.auth_type,
    auth_header_name: result.auth_header_name ?? undefined,
    auth_secret: secret || undefined,
  };
}

export function formatNormalizedConfig(config: Record<string, unknown>): string {
  return JSON.stringify(config, null, 2);
}
