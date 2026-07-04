import {
  authTypeOptions,
  needsAuthSecret,
  needsCustomHeaderName,
  supportsOptionalHeaderName,
} from '@/components/kb/authConfig';
import { Form, Input, Select, Typography } from 'antd';
import type { AuthType } from '@/types/kb';

const { Text } = Typography;

interface AuthConfigFieldsProps {
  editMode?: boolean;
}

export function AuthConfigFields({ editMode = false }: AuthConfigFieldsProps) {
  const authType = Form.useWatch('auth_type') as AuthType | undefined;

  return (
    <>
      <Form.Item
        label="鉴权方式"
        name="auth_type"
        rules={[{ required: true, message: '请选择鉴权方式' }]}
      >
        <Select
          options={authTypeOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      </Form.Item>

      {authType && authType !== 'none' && (
        <Form.Item label="Header 格式">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {authTypeOptions.find((opt) => opt.value === authType)?.headerPreview}
          </Text>
        </Form.Item>
      )}

      {authType && needsCustomHeaderName(authType) && (
        <Form.Item
          label="Header 名称"
          name="auth_header_name"
          rules={[
            { required: true, message: '请输入 Header 名称' },
            {
              pattern: /^[A-Za-z0-9-]+$/,
              message: 'Header 名称仅允许字母、数字和连字符',
            },
          ]}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              例：X-Goog-Api-Key（Google Stitch / Cursor MCP 常用）
            </Text>
          }
        >
          <Input placeholder="X-Goog-Api-Key" />
        </Form.Item>
      )}

      {authType && supportsOptionalHeaderName(authType) && (
        <Form.Item
          label="Header 名称（可选）"
          name="auth_header_name"
          rules={[
            {
              pattern: /^[A-Za-z0-9-]*$/,
              message: 'Header 名称仅允许字母、数字和连字符',
            },
          ]}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              留空则使用默认 X-API-Key
            </Text>
          }
        >
          <Input placeholder="X-API-Key" />
        </Form.Item>
      )}

      {authType && needsAuthSecret(authType) && (
        <Form.Item
          label="密钥 / Token"
          name="auth_secret"
          rules={[
            {
              required: !editMode,
              message: '请输入密钥或 Token',
            },
          ]}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              密钥不在前端明文展示，仅用于后端加密存储
            </Text>
          }
        >
          <Input.Password
            placeholder={editMode ? '留空则保持原密钥不变' : '请输入密钥或 Token'}
          />
        </Form.Item>
      )}
    </>
  );
}

export { authTypeOptions };
