import { CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, App, Button, Input, Select, Space, Typography } from 'antd';
import { useState } from 'react';
import { parseMcpConfig } from '@/api/kb';
import {
  DEFAULT_MCP_CONFIG_TEMPLATE,
  formatNormalizedConfig,
  parseJsonSafe,
} from '@/components/kb/mcpConfigUtils';
import type { ParseMcpConfigResponse } from '@/types/kb';
import { colors, fontFamily, spacing } from '@/tokens';

const { Text } = Typography;
const { TextArea } = Input;

interface McpConfigEditorProps {
  value: string;
  onChange: (value: string) => void;
  onParsed: (result: ParseMcpConfigResponse) => void;
  secretOverride: string;
  onSecretOverrideChange: (value: string) => void;
  disabled?: boolean;
}

export function McpConfigEditor({
  value,
  onChange,
  onParsed,
  secretOverride,
  onSecretOverrideChange,
  disabled,
}: McpConfigEditorProps) {
  const { message } = App.useApp();
  const [parsing, setParsing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [availableServers, setAvailableServers] = useState<string[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | undefined>();
  const [hasEnvPlaceholder, setHasEnvPlaceholder] = useState(false);
  const [normalizedConfig, setNormalizedConfig] = useState<Record<string, unknown> | null>(null);

  const runParse = async (serverName?: string) => {
    const parsed = parseJsonSafe(value);
    if (!parsed.ok) {
      message.error(parsed.error);
      return;
    }

    setParsing(true);
    try {
      const result = await parseMcpConfig({
        config: parsed.value as Record<string, unknown>,
        server_name: serverName,
      });

      setWarnings(result.warnings);
      setAvailableServers(result.available_servers);
      setHasEnvPlaceholder(result.has_env_placeholder);
      setNormalizedConfig(
        Object.keys(result.normalized_config).length > 0 ? result.normalized_config : null,
      );

      if (result.needs_server_selection) {
        if (result.available_servers.length > 0) {
          setSelectedServer(result.available_servers[0]);
        }
        message.info('检测到多个 MCP Server，请选择要挂载的实例后重新解析');
        return;
      }

      onParsed(result);
      message.success('配置解析成功');
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      message.error(typeof detail === 'string' ? detail : '配置解析失败');
    } finally {
      setParsing(false);
    }
  };

  const handleParse = () => {
    if (availableServers.length > 1 && selectedServer) {
      void runParse(selectedServer);
    } else {
      void runParse();
    }
  };

  const handleCopy = async () => {
    const text = normalizedConfig
      ? formatNormalizedConfig(normalizedConfig)
      : value;
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制 MCP 配置');
    } catch {
      message.error('复制失败');
    }
  };

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: spacing.sm }}>
        支持 Cursor mcp.json 格式（仅远程 url，不支持 command/stdio）
      </Text>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        disabled={disabled}
        placeholder={DEFAULT_MCP_CONFIG_TEMPLATE}
        style={{ fontFamily: fontFamily.mono, fontSize: 12 }}
      />
      {availableServers.length > 1 && (
        <div style={{ marginTop: spacing.sm }}>
          <Text type="secondary" style={{ fontSize: 12, marginRight: spacing.sm }}>
            选择 MCP Server
          </Text>
          <Select
            style={{ minWidth: 200 }}
            value={selectedServer}
            options={availableServers.map((name) => ({ value: name, label: name }))}
            onChange={setSelectedServer}
          />
        </div>
      )}
      {warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: spacing.sm }}
          message="解析提示"
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          }
        />
      )}
      {hasEnvPlaceholder && (
        <div style={{ marginTop: spacing.sm }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            密钥覆盖（配置含环境变量占位符时必填）
          </Text>
          <Input.Password
            value={secretOverride}
            onChange={(e) => onSecretOverrideChange(e.target.value)}
            placeholder="输入实际密钥或 Token"
          />
        </div>
      )}
      <Space style={{ marginTop: spacing.sm }}>
        <Button
          icon={<ThunderboltOutlined />}
          loading={parsing}
          onClick={handleParse}
          disabled={disabled}
        >
          解析配置
        </Button>
        <Button icon={<CopyOutlined />} onClick={() => void handleCopy()} disabled={disabled}>
          复制为标准 JSON
        </Button>
      </Space>
      <Text
        type="secondary"
        style={{ fontSize: 11, display: 'block', marginTop: spacing.xs, color: colors.onSurfaceVariant }}
      >
        解析成功后将自动同步到表单字段；测试连接前请先点击「解析配置」
      </Text>
    </div>
  );
}
