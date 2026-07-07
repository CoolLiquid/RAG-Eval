import { ApiOutlined, LogoutOutlined, RobotOutlined, SlidersOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Slider,
  Space,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSettings, testLlmConnection, updateSettings } from '@/api/settings';
import { getCurrentUsername, logout } from '@/auth/session';
import type { LlmModelName } from '@/types/settings';
import { LLM_MODEL_OPTIONS, MCP_TIMEOUT_SECONDS } from '@/types/settings';
import type { ScoringMethod } from '@/types/evaluation';
import { colors, spacing } from '@/tokens';

const { Title, Paragraph, Text } = Typography;

type SettingsTab = 'llm' | 'evaluation' | 'account';

interface SettingsFormValues {
  api_base_url: string;
  model_name: LlmModelName;
  api_key: string;
  top_k: number;
  pass_threshold: number;
  mcp_timeout_seconds: number;
  scoring_method: ScoringMethod;
}

function formatSavedAt(iso: string | null | undefined): string {
  if (!iso) return '尚未保存';
  return dayjs(iso).format('YYYY-MM-DD HH:mm:ss');
}

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm<SettingsFormValues>();
  const [activeTab, setActiveTab] = useState<SettingsTab>('llm');

  const username = getCurrentUsername() ?? 'admin';

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (!settings) return;

    form.setFieldsValue({
      api_base_url: settings.llm.api_base_url,
      model_name: settings.llm.model_name,
      api_key: '',
      top_k: settings.evaluation_defaults.top_k,
      pass_threshold: settings.evaluation_defaults.pass_threshold,
      mcp_timeout_seconds: settings.evaluation_defaults.mcp_timeout_ms / 1000,
      scoring_method: settings.evaluation_defaults.scoring_method,
    });
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
      form.setFieldValue('api_key', '');
      message.success('设置已保存');
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const detail = error.response?.data?.detail;
      message.error(typeof detail === 'string' ? detail : '保存失败');
    },
  });

  const testMutation = useMutation({
    mutationFn: testLlmConnection,
    onSuccess: (result) => {
      if (result.success) {
        const latency =
          result.latency_ms != null ? `（${result.latency_ms} ms）` : '';
        message.success(`${result.message}${latency}`);
      } else {
        message.error(result.message);
      }
    },
    onError: () => {
      message.error('测试连接失败');
    },
  });

  const handleSave = (values: SettingsFormValues) => {
    saveMutation.mutate({
      llm: {
        api_base_url: values.api_base_url.trim(),
        model_name: values.model_name,
        ...(values.api_key.trim() ? { api_key: values.api_key.trim() } : {}),
      },
      evaluation_defaults: {
        top_k: values.top_k,
        pass_threshold: values.pass_threshold,
        mcp_timeout_ms: values.mcp_timeout_seconds * 1000,
        scoring_method: values.scoring_method,
      },
    });
  };

  const handleTestLlm = async () => {
    try {
      const values = await form.validateFields([
        'api_base_url',
        'model_name',
      ]);
      const apiKey = form.getFieldValue('api_key') as string;
      testMutation.mutate({
        api_base_url: values.api_base_url.trim(),
        model_name: values.model_name,
        ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
      });
    } catch {
      setActiveTab('llm');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const tabItems = [
    {
      key: 'llm',
      label: (
        <Space>
          <RobotOutlined />
          LLM 配置
        </Space>
      ),
      children: (
        <Card bordered={false} style={{ background: colors.surfaceContainerLow }}>
          <Paragraph type="secondary" style={{ marginTop: 0 }}>
            配置 OpenAI 兼容 API，用于 RAG 生成与 LLM 裁判评分。密钥仅在后端存储，不会明文返回。
          </Paragraph>

          <Form.Item
            name="api_base_url"
            label="API Base URL"
            rules={[
              { required: true, message: '请输入 API Base URL' },
              { type: 'url', message: '请输入有效的 URL' },
            ]}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                例：https://api.openai.com/v1
              </Text>
            }
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            name="model_name"
            label="模型名称"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select options={LLM_MODEL_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="api_key"
            label="API Key"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {settings?.llm.api_key_configured
                  ? `当前密钥：${settings.llm.api_key_masked}，留空则保持不变`
                  : '密钥不在前端明文展示，仅用于后端加密存储'}
              </Text>
            }
          >
            <Input.Password
              placeholder={
                settings?.llm.api_key_configured ? '留空则保持原密钥不变' : '请输入 API Key'
              }
            />
          </Form.Item>

          <Button
            icon={<ApiOutlined />}
            onClick={handleTestLlm}
            loading={testMutation.isPending}
          >
            测试 LLM 连接
          </Button>
        </Card>
      ),
    },
    {
      key: 'evaluation',
      label: (
        <Space>
          <SlidersOutlined />
          默认测评参数
        </Space>
      ),
      children: (
        <Card bordered={false} style={{ background: colors.surfaceContainerLow }}>
          <Paragraph type="secondary" style={{ marginTop: 0 }}>
            创建测评任务时的默认参数，可在单次任务中覆盖。
          </Paragraph>

          <Form.Item name="top_k" label="Top-K 检索条数">
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="pass_threshold" label="通过阈值">
            <Slider min={0} max={100} marks={{ 0: '0', 70: '70', 100: '100' }} />
          </Form.Item>

          <Form.Item name="mcp_timeout_seconds" label="单题超时">
            <Select
              options={MCP_TIMEOUT_SECONDS.map((seconds) => ({
                value: seconds,
                label: `${seconds} 秒`,
              }))}
            />
          </Form.Item>

          <Form.Item name="scoring_method" label="评分方式">
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="llm_judge">
                  <Tooltip title="MVP 使用启发式规则模拟 LLM 裁判，后续接入真实 LLM">
                    LLM 裁判
                  </Tooltip>
                </Radio>
                <Radio value="semantic_similarity">
                  <Tooltip title="基于片段与期望答案的语义相似度，成本低、速度快">
                    语义相似度
                  </Tooltip>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Card>
      ),
    },
    {
      key: 'account',
      label: (
        <Space>
          <LogoutOutlined />
          账号
        </Space>
      ),
      children: (
        <Card bordered={false} style={{ background: colors.surfaceContainerLow }}>
          <Alert
            type="info"
            showIcon
            message="MVP 单用户模式"
            description="当前版本使用环境变量或内置默认账号登录，暂不支持在线修改密码。"
            style={{ marginBottom: spacing.lg }}
          />

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="当前账号">{username}</Descriptions.Item>
            <Descriptions.Item label="角色">管理员</Descriptions.Item>
            <Descriptions.Item label="认证方式">本地会话（localStorage）</Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: spacing.lg }}>
            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <div>
        <Title level={3} style={{ marginBottom: spacing.xs }}>
          系统设置
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          LLM 配置、默认测评参数与账号管理
        </Paragraph>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        disabled={isLoading}
        initialValues={{
          api_base_url: 'https://api.openai.com/v1',
          model_name: 'gpt-4o-mini',
          top_k: 5,
          pass_threshold: 70,
          mcp_timeout_seconds: 30,
          scoring_method: 'llm_judge',
        }}
      >
        <Tabs
          tabPosition="left"
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as SettingsTab)}
          items={tabItems}
          style={{ minHeight: 420 }}
        />

        {activeTab !== 'account' && (
          <div
            style={{
              marginTop: spacing.lg,
              paddingTop: spacing.md,
              borderTop: `1px solid ${colors.outlineVariant}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: spacing.sm,
            }}
          >
            <Text type="secondary">
              上次保存：{formatSavedAt(settings?.updated_at)}
            </Text>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              保存设置
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
}
