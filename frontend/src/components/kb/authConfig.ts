import type { AuthType } from '@/types/kb';

export interface AuthTypeOption {
  value: AuthType;
  label: string;
  description: string;
  headerPreview: string;
}

export const authTypeOptions: AuthTypeOption[] = [
  {
    value: 'none',
    label: '无鉴权',
    description: 'MCP Server 无需鉴权',
    headerPreview: '—',
  },
  {
    value: 'api_key',
    label: 'API Key (X-API-Key)',
    description: '标准 API Key Header，可自定义 Header 名称',
    headerPreview: 'X-API-Key: <key>',
  },
  {
    value: 'authorization_api_key',
    label: 'API Key (Authorization)',
    description: '通过 Authorization Header 传递 ApiKey',
    headerPreview: 'Authorization: ApiKey <key>',
  },
  {
    value: 'bearer',
    label: 'Bearer Token',
    description: 'OAuth / JWT 等 Bearer 令牌',
    headerPreview: 'Authorization: Bearer <token>',
  },
  {
    value: 'custom_header',
    label: '自定义 Header',
    description: '兼容 Cursor MCP 等第三方 Header，如 X-Goog-Api-Key',
    headerPreview: '<Header-Name>: <key>',
  },
];

export function formatAuthDisplay(
  authType: AuthType,
  authSecretMasked: string,
  authHeaderName?: string | null,
): string {
  switch (authType) {
    case 'none':
      return '无鉴权';
    case 'api_key': {
      const header = authHeaderName || 'X-API-Key';
      return `${header} · ${authSecretMasked}`;
    }
    case 'authorization_api_key':
      return `Authorization: ApiKey · ${authSecretMasked}`;
    case 'bearer':
      return `Authorization: Bearer · ${authSecretMasked}`;
    case 'custom_header':
      return authHeaderName
        ? `${authHeaderName} · ${authSecretMasked}`
        : authSecretMasked;
    default:
      return authSecretMasked;
  }
}

export function needsAuthSecret(authType: AuthType): boolean {
  return authType !== 'none';
}

export function needsCustomHeaderName(authType: AuthType): boolean {
  return authType === 'custom_header';
}

export function supportsOptionalHeaderName(authType: AuthType): boolean {
  return authType === 'api_key';
}
