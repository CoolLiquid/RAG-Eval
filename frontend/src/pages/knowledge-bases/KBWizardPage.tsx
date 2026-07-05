import {
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Radio,
  Row,
  Space,
  Spin,
  Steps,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createKb,
  discoverKbTools,
  fetchKbById,
  parseMcpConfig,
  testKbConnection,
  trialKbSearch,
  updateKb,
} from '@/api/kb';
import { ChunkPreviewCard } from '@/components/kb/ChunkPreviewCard';
import { AuthConfigFields } from '@/components/kb/AuthConfigFields';
import { needsAuthSecret } from '@/components/kb/authConfig';
import { McpConfigEditor } from '@/components/kb/McpConfigEditor';
import {
  applyParseResultToForm,
  buildMcpConfigJsonFromForm,
  DEFAULT_MCP_CONFIG_TEMPLATE,
  parseJsonSafe,
} from '@/components/kb/mcpConfigUtils';
import { WizardSummaryCard } from '@/components/kb/WizardSummaryCard';
import type { AuthType, Chunk, ParseMcpConfigResponse, ToolInfo } from '@/types/kb';
import { colors, spacing } from '@/tokens';

const { Title, Paragraph, Text } = Typography;

type ConfigMode = 'json' | 'form';

type ConnectionFormValues = {
  name: string;
  endpoint: string;
  auth_type: AuthType;
  auth_header_name?: string;
  auth_secret?: string;
};

const STEPS = [
  { title: '连接' },
  { title: '选择 Tool' },
  { title: '试检索' },
  { title: '保存' },
];

export function KBWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { message } = App.useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [kbId, setKbId] = useState<string | null>(editId);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('kb_search');
  const [trialQuery, setTrialQuery] = useState('退货政策是什么');
  const [trialResults, setTrialResults] = useState<Chunk[]>([]);
  const [summary, setSummary] = useState<Partial<ConnectionFormValues>>({});
  const [configMode, setConfigMode] = useState<ConfigMode>('json');
  const [mcpJsonText, setMcpJsonText] = useState(DEFAULT_MCP_CONFIG_TEMPLATE);
  const [secretOverride, setSecretOverride] = useState('');
  const [jsonParsed, setJsonParsed] = useState(false);

  const [connectionForm] = Form.useForm<ConnectionFormValues>();

  const { data: existingKb, isLoading: loadingExisting } = useQuery({
    queryKey: ['kb', editId],
    queryFn: () => fetchKbById(editId!),
    enabled: Boolean(editId),
  });

  useEffect(() => {
    if (!existingKb) return;
    setKbId(existingKb.id);
    setSelectedTool(existingKb.retrieval_tool ?? 'kb_search');
    setSummary({
      name: existingKb.name,
      endpoint: existingKb.endpoint,
      auth_type: existingKb.auth_type,
      auth_header_name: existingKb.auth_header_name ?? undefined,
      auth_secret: '********',
    });
    connectionForm.setFieldsValue({
      name: existingKb.name,
      endpoint: existingKb.endpoint,
      auth_type: existingKb.auth_type,
      auth_header_name: existingKb.auth_header_name ?? undefined,
      auth_secret: '',
    });
    setMcpJsonText(
      buildMcpConfigJsonFromForm(
        existingKb.endpoint,
        existingKb.auth_type,
        existingKb.auth_header_name,
        existingKb.auth_secret_masked,
      ),
    );
    setJsonParsed(true);
  }, [existingKb, connectionForm]);

  const createMutation = useMutation({ mutationFn: createKb });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateKb>[1] }) =>
      updateKb(id, payload),
  });
  const testMutation = useMutation({ mutationFn: testKbConnection });
  const discoverMutation = useMutation({ mutationFn: discoverKbTools });
  const trialMutation = useMutation({
    mutationFn: ({ id, query }: { id: string; query: string }) => trialKbSearch(id, query),
  });

  const authType = Form.useWatch('auth_type', connectionForm);
  const authHeaderName = Form.useWatch('auth_header_name', connectionForm);
  const watchedName = Form.useWatch('name', connectionForm);
  const watchedEndpoint = Form.useWatch('endpoint', connectionForm);
  const watchedSecret = Form.useWatch('auth_secret', connectionForm);

  const summaryData = useMemo(
    () => ({
      name: watchedName || summary.name,
      endpoint: watchedEndpoint || summary.endpoint,
      authType: authType || summary.auth_type,
      authHeaderName: authHeaderName || summary.auth_header_name,
      authSecretMasked:
        (authType || summary.auth_type) === 'none'
          ? undefined
          : watchedSecret || summary.auth_secret
            ? '••••••••'
            : existingKb?.auth_secret_masked,
      retrievalTool: selectedTool,
    }),
    [
      watchedName,
      watchedEndpoint,
      authType,
      authHeaderName,
      watchedSecret,
      summary,
      selectedTool,
      existingKb?.auth_secret_masked,
    ],
  );

  const buildAuthPayload = (values: ConnectionFormValues) => ({
    auth_type: values.auth_type,
    auth_header_name: values.auth_header_name?.trim() || null,
    ...(values.auth_secret ? { auth_secret: values.auth_secret } : {}),
    ...(values.auth_type === 'none' ? { auth_secret: '' } : {}),
  });

  const handleMcpParsed = (result: ParseMcpConfigResponse) => {
    const fields = applyParseResultToForm(result, secretOverride);
    if (!fields) return;
    connectionForm.setFieldsValue({
      endpoint: fields.endpoint,
      auth_type: fields.auth_type,
      auth_header_name: fields.auth_header_name,
      auth_secret: fields.auth_secret || connectionForm.getFieldValue('auth_secret'),
    });
    setJsonParsed(true);
  };

  const handleConfigModeChange = (mode: ConfigMode) => {
    if (mode === 'json' && configMode === 'form') {
      const endpoint = connectionForm.getFieldValue('endpoint');
      const formAuthType = connectionForm.getFieldValue('auth_type');
      const formAuthHeaderName = connectionForm.getFieldValue('auth_header_name');
      const formSecret = connectionForm.getFieldValue('auth_secret');
      if (endpoint && formAuthType) {
        const masked = formSecret || existingKb?.auth_secret_masked || '••••••••';
        setMcpJsonText(
          buildMcpConfigJsonFromForm(endpoint, formAuthType, formAuthHeaderName, masked),
        );
      }
    }
    setConfigMode(mode);
  };

  const resolveJsonModeValues = async (): Promise<ConnectionFormValues | null> => {
    const name = connectionForm.getFieldValue('name');
    if (!name?.trim()) {
      message.error('请输入知识库名称');
      return null;
    }

    const parsed = parseJsonSafe(mcpJsonText);
    if (!parsed.ok) {
      message.error(parsed.error);
      return null;
    }

    try {
      const result = await parseMcpConfig({
        config: parsed.value as Record<string, unknown>,
      });

      if (result.needs_server_selection) {
        message.error('检测到多个 MCP Server，请选择实例并点击「解析配置」');
        return null;
      }

      if (result.has_env_placeholder && !secretOverride.trim() && !editId) {
        message.error('配置含环境变量占位符，请填写密钥覆盖');
        return null;
      }

      const fields = applyParseResultToForm(result, secretOverride);
      if (!fields) {
        message.error('请先点击「解析配置」');
        return null;
      }

      if (
        needsAuthSecret(fields.auth_type) &&
        !editId &&
        !fields.auth_secret?.trim() &&
        !secretOverride.trim()
      ) {
        message.error('请输入密钥或 Token');
        return null;
      }

      const values: ConnectionFormValues = {
        name: name.trim(),
        endpoint: fields.endpoint,
        auth_type: fields.auth_type,
        auth_header_name: fields.auth_header_name,
        auth_secret: secretOverride.trim() || fields.auth_secret,
      };

      connectionForm.setFieldsValue(values);
      setJsonParsed(true);
      return values;
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      message.error(typeof detail === 'string' ? detail : '配置解析失败');
      return null;
    }
  };

  const handleStep1Next = async (values: ConnectionFormValues) => {
    if (needsAuthSecret(values.auth_type) && !editId && !values.auth_secret?.trim()) {
      message.error('请输入密钥或 Token');
      return;
    }
    setSummary(values);

    const authPayload = buildAuthPayload(values);

    try {
      let activeId = kbId;
      if (kbId) {
        await updateMutation.mutateAsync({
          id: kbId,
          payload: {
            name: values.name,
            endpoint: values.endpoint,
            ...authPayload,
          },
        });
      } else {
        const created = await createMutation.mutateAsync({
          name: values.name,
          endpoint: values.endpoint,
          ...authPayload,
          auth_secret: authPayload.auth_secret ?? '',
        });
        activeId = created.id;
        setKbId(created.id);
      }

      const testResult = await testMutation.mutateAsync(activeId!);
      if (!testResult.success) {
        message.error(testResult.message);
        return;
      }

      message.success('连接测试成功');
      setCurrentStep(1);
    } catch {
      message.error('连接失败，请检查 Endpoint 与鉴权信息');
    }
  };

  const handleStep1Submit = async () => {
    if (configMode === 'json') {
      if (!jsonParsed) {
        message.warning('请先点击「解析配置」');
      }
      const values = await resolveJsonModeValues();
      if (!values) return;
      await handleStep1Next(values);
      return;
    }

    try {
      const values = await connectionForm.validateFields();
      await handleStep1Next(values);
    } catch {
      message.warning('请完善连接配置后再测试');
    }
  };

  const handleStep2Next = async () => {
    if (!kbId) return;
    try {
      await updateMutation.mutateAsync({
        id: kbId,
        payload: { retrieval_tool: selectedTool },
      });
      setCurrentStep(2);
    } catch {
      message.error('保存 Tool 选择失败');
    }
  };

  const loadTools = async () => {
    if (!kbId) return;
    try {
      const result = await discoverMutation.mutateAsync(kbId);
      setTools(result.tools);
      if (result.tools.some((t) => t.name === 'kb_search')) {
        setSelectedTool('kb_search');
      } else if (result.tools.length > 0) {
        setSelectedTool(result.tools[0].name);
      }
    } catch {
      message.error('发现 Tools 失败，请返回上一步重新测试连接');
    }
  };

  useEffect(() => {
    if (currentStep === 1 && kbId && tools.length === 0) {
      loadTools();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, kbId]);

  const handleTrialSearch = async () => {
    if (!kbId || !trialQuery.trim()) return;
    try {
      const result = await trialMutation.mutateAsync({ id: kbId, query: trialQuery.trim() });
      setTrialResults(result.chunks);
      if (result.count === 0) {
        message.info('调用成功，返回 0 条结果');
      }
    } catch {
      message.error('试检索失败');
    }
  };

  const handleSave = async () => {
    if (!kbId) return;
    try {
      await updateMutation.mutateAsync({
        id: kbId,
        payload: { status: 'connected' },
      });
      message.success('知识库挂载成功');
      navigate('/knowledge-bases');
    } catch {
      message.error('保存失败');
    }
  };

  if (editId && loadingExisting) {
    return (
      <div style={{ textAlign: 'center', padding: spacing.xl }}>
        <Spin indicator={<LoadingOutlined spin />} />
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        {editId ? '编辑 MCP 知识库' : '挂载 MCP 知识库'}
      </Title>
      <Paragraph type="secondary">
        4 步向导：连接 → 选择 Tool → 试检索 → 保存
      </Paragraph>

      <Steps
        current={currentStep}
        items={STEPS.map((step, index) => ({
          title: step.title,
          icon: index < currentStep ? <CheckCircleOutlined /> : undefined,
        }))}
        style={{ marginBottom: spacing.lg, maxWidth: 720 }}
      />

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          {currentStep === 0 && (
            <Card title="连接 MCP Server">
              <Form
                form={connectionForm}
                layout="vertical"
                requiredMark={false}
                initialValues={{ auth_type: 'api_key' as AuthType }}
              >
                <Form.Item
                  label="名称"
                  name="name"
                  rules={[{ required: true, message: '请输入知识库名称' }]}
                >
                  <Input placeholder="例：售后知识库" />
                </Form.Item>

                <Form.Item label="配置方式">
                  <Radio.Group
                    value={configMode}
                    onChange={(e) => handleConfigModeChange(e.target.value as ConfigMode)}
                  >
                    <Radio.Button value="json">JSON 配置</Radio.Button>
                    <Radio.Button value="form">高级表单</Radio.Button>
                  </Radio.Group>
                </Form.Item>

                {configMode === 'json' ? (
                  <McpConfigEditor
                    value={mcpJsonText}
                    onChange={(text) => {
                      setMcpJsonText(text);
                      setJsonParsed(false);
                    }}
                    onParsed={handleMcpParsed}
                    secretOverride={secretOverride}
                    onSecretOverrideChange={setSecretOverride}
                  />
                ) : (
                  <>
                    <Form.Item
                      label="MCP Endpoint URL"
                      name="endpoint"
                      rules={[
                        { required: true, message: '请输入 Endpoint URL' },
                        {
                          type: 'url',
                          message: '请输入有效的 http(s) URL',
                        },
                      ]}
                    >
                      <Input placeholder="https://your-domain.com/mcp" />
                    </Form.Item>
                    <AuthConfigFields editMode={Boolean(editId)} />
                  </>
                )}

                <Form.Item name="endpoint" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="auth_type" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="auth_header_name" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="auth_secret" hidden>
                  <Input />
                </Form.Item>

                <Space>
                  <Button onClick={() => navigate('/knowledge-bases')}>取消</Button>
                  <Button
                    type="primary"
                    loading={
                      createMutation.isPending ||
                      updateMutation.isPending ||
                      testMutation.isPending
                    }
                    onClick={() => void handleStep1Submit()}
                  >
                    测试连接并继续
                  </Button>
                </Space>
              </Form>
            </Card>
          )}

          {currentStep === 1 && (
            <Card title="选择检索 Tool">
              {discoverMutation.isPending ? (
                <div style={{ textAlign: 'center', padding: spacing.lg }}>
                  <Spin tip="正在发现 Tools..." />
                </div>
              ) : tools.length === 0 ? (
                <Empty description="未发现可用 Tool" />
              ) : (
                <Radio.Group
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {tools.map((tool) => (
                      <Card
                        key={tool.name}
                        size="small"
                        hoverable
                        onClick={() => setSelectedTool(tool.name)}
                        style={{
                          borderColor:
                            selectedTool === tool.name ? colors.primary : colors.outlineVariant,
                          cursor: 'pointer',
                        }}
                      >
                        <Radio value={tool.name}>
                          <Text strong>{tool.name}</Text>
                          {tool.name === 'kb_search' && (
                            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                              推荐
                            </Text>
                          )}
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {tool.description}
                            </Text>
                          </div>
                        </Radio>
                      </Card>
                    ))}
                  </Space>
                </Radio.Group>
              )}
              <Space style={{ marginTop: spacing.lg }}>
                <Button onClick={() => setCurrentStep(0)}>上一步</Button>
                <Button
                  type="primary"
                  disabled={!selectedTool}
                  loading={updateMutation.isPending}
                  onClick={handleStep2Next}
                >
                  下一步
                </Button>
              </Space>
            </Card>
          )}

          {currentStep === 2 && (
            <Card title="试检索">
              <Paragraph type="secondary">
                输入测试问题，预览 MCP 返回的知识片段
              </Paragraph>
              <Space.Compact style={{ width: '100%', marginBottom: spacing.md }}>
                <Input
                  value={trialQuery}
                  onChange={(e) => setTrialQuery(e.target.value)}
                  placeholder="退货政策是什么"
                  onPressEnter={handleTrialSearch}
                />
                <Button
                  type="primary"
                  loading={trialMutation.isPending}
                  onClick={handleTrialSearch}
                >
                  执行试检索
                </Button>
              </Space.Compact>
              {trialResults.length === 0 && !trialMutation.isPending && (
                <div
                  style={{
                    padding: spacing.lg,
                    textAlign: 'center',
                    background: colors.surfaceContainerLow,
                    borderRadius: 8,
                    color: colors.onSurfaceVariant,
                    marginBottom: spacing.md,
                  }}
                >
                  调用成功，返回 0 条结果（或尚未执行检索）
                </div>
              )}
              {trialResults.map((chunk, index) => (
                <ChunkPreviewCard key={`${chunk.source}-${index}`} chunk={chunk} />
              ))}
              <Space style={{ marginTop: spacing.md }}>
                <Button onClick={() => setCurrentStep(1)}>上一步</Button>
                <Button type="primary" onClick={() => setCurrentStep(3)}>
                  下一步：保存
                </Button>
              </Space>
            </Card>
          )}

          {currentStep === 3 && (
            <Card title="确认保存">
              <Paragraph>
                请确认配置信息无误，保存后可在 MCP 知识库列表中管理该实例，并发起测评任务。
              </Paragraph>
              <Space>
                <Button onClick={() => setCurrentStep(2)}>上一步</Button>
                <Button
                  type="primary"
                  loading={updateMutation.isPending}
                  onClick={handleSave}
                >
                  保存并完成挂载
                </Button>
              </Space>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <WizardSummaryCard
            name={summaryData.name}
            endpoint={summaryData.endpoint}
            retrievalTool={summaryData.retrievalTool}
            authType={summaryData.authType}
            authHeaderName={summaryData.authHeaderName}
            authSecretMasked={summaryData.authSecretMasked}
            actionLabel={
              currentStep === 3
                ? '保存并完成挂载'
                : currentStep === 2
                  ? '下一步：保存'
                  : undefined
            }
            onAction={
              currentStep === 3
                ? handleSave
                : currentStep === 2
                  ? () => setCurrentStep(3)
                  : undefined
            }
            actionLoading={updateMutation.isPending}
          />
        </Col>
      </Row>
    </div>
  );
}
