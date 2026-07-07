import { ArrowLeftOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Segmented,
  Select,
  Slider,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createEvaluation } from '@/api/evaluations';
import { fetchKbList } from '@/api/kb';
import { fetchQuestionBankList } from '@/api/questionBanks';
import { fetchSettings } from '@/api/settings';
import type { EvaluationCreatePayload, ScoringMethod } from '@/types/evaluation';
import { colors, spacing } from '@/tokens';

const { Title, Paragraph, Text } = Typography;

interface FormValues {
  name: string;
  kb_id: string;
  question_bank_id: string;
  mode: 'retrieval_only';
  top_k: number;
  pass_threshold: number;
  scoring_method: ScoringMethod;
}

export function CreateEvaluationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();

  const preselectedBankId = searchParams.get('questionBankId') ?? undefined;

  const { data: kbData, isLoading: kbLoading } = useQuery({
    queryKey: ['kb', {}],
    queryFn: () => fetchKbList({ status: 'connected' }),
  });

  const { data: bankData, isLoading: bankLoading } = useQuery({
    queryKey: ['question-banks', {}],
    queryFn: () => fetchQuestionBankList(),
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (preselectedBankId) {
      form.setFieldValue('question_bank_id', preselectedBankId);
    }
  }, [preselectedBankId, form]);

  useEffect(() => {
    if (!settingsData) return;
    const defaults = settingsData.evaluation_defaults;
    form.setFieldsValue({
      top_k: defaults.top_k,
      pass_threshold: defaults.pass_threshold,
      scoring_method: defaults.scoring_method,
    });
  }, [settingsData, form]);

  const createMutation = useMutation({
    mutationFn: (payload: EvaluationCreatePayload) => createEvaluation(payload),
    onSuccess: (task) => {
      message.success('测评任务已创建');
      navigate(`/evaluations/${task.id}/running`);
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const detail = error.response?.data?.detail;
      message.error(typeof detail === 'string' ? detail : '创建失败');
    },
  });

  const connectedKbs = kbData?.items ?? [];
  const banks = bankData?.items ?? [];

  const handleSubmit = (values: FormValues) => {
    createMutation.mutate({
      name: values.name.trim(),
      kb_id: values.kb_id,
      question_bank_id: values.question_bank_id,
      mode: 'retrieval_only',
      config: {
        top_k: values.top_k,
        pass_threshold: values.pass_threshold,
        scoring_method: values.scoring_method,
        mcp_timeout_ms: (settingsData?.evaluation_defaults.mcp_timeout_ms ?? 30000),
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <div>
        <Space style={{ marginBottom: spacing.sm }}>
          <Link to="/evaluations">
            <Button type="text" icon={<ArrowLeftOutlined />}>
              返回列表
            </Button>
          </Link>
        </Space>
        <Title level={3} style={{ marginBottom: spacing.xs }}>
          创建测评任务
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          选择 MCP 知识库、题库与测评参数，创建后将自动开始批量执行
        </Paragraph>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          top_k: 5,
          pass_threshold: 70,
          scoring_method: 'semantic_similarity',
          mode: 'retrieval_only',
        }}
      >
        <Row gutter={[spacing.lg, spacing.lg]}>
          <Col xs={24} lg={14}>
            <Card title="基本配置" style={{ marginBottom: spacing.lg }}>
              <Form.Item
                name="name"
                label="任务名称"
                rules={[{ required: true, message: '请输入任务名称' }]}
              >
                <Input placeholder="例：售后政策 v1.2 回归" maxLength={200} />
              </Form.Item>

              <Form.Item
                name="kb_id"
                label="MCP 知识库"
                rules={[{ required: true, message: '请选择知识库' }]}
              >
                <Select
                  placeholder="选择已连接的知识库"
                  loading={kbLoading}
                  options={connectedKbs.map((kb) => ({
                    value: kb.id,
                    label: `${kb.name}（${kb.retrieval_tool ?? '未配置 Tool'}）`,
                  }))}
                  notFoundContent={
                    kbLoading ? '加载中...' : '暂无已连接的知识库，请先在 MCP 知识库页测试连接'
                  }
                />
              </Form.Item>

              <Form.Item
                name="question_bank_id"
                label="测评题库"
                rules={[{ required: true, message: '请选择题库' }]}
              >
                <Select
                  placeholder="选择内置或自定义题库"
                  loading={bankLoading}
                  options={banks.map((bank) => ({
                    value: bank.id,
                    label: `${bank.name}（${bank.question_count} 题）`,
                  }))}
                />
              </Form.Item>

              <Form.Item name="mode" label="测评模式">
                <Segmented
                  options={[
                    { label: '检索测评 retrieval_only', value: 'retrieval_only' },
                    { label: 'RAG 全链路（即将推出）', value: 'rag_full', disabled: true },
                  ]}
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 12 }}>
                检索测评仅评估 MCP 返回的知识片段质量，不经过 LLM 生成
              </Text>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="高级参数">
              <Form.Item name="top_k" label="Top-K 检索条数">
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="pass_threshold" label="通过阈值">
                <Slider min={0} max={100} marks={{ 0: '0', 70: '70', 100: '100' }} />
              </Form.Item>

              <Form.Item name="scoring_method" label="评分方式">
                <Radio.Group>
                  <Space direction="vertical">
                    <Radio value="semantic_similarity">
                      <Tooltip title="基于片段与期望答案的语义相似度，成本低、速度快">
                        语义相似度
                      </Tooltip>
                    </Radio>
                    <Radio value="llm_judge">
                      <Tooltip title="MVP 使用启发式规则模拟 LLM 裁判，后续接入真实 LLM">
                        LLM 裁判（启发式）
                      </Tooltip>
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: colors.surface,
            borderTop: `1px solid ${colors.outlineVariant}`,
            padding: `${spacing.md}px 0`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: spacing.sm,
          }}
        >
          <Button onClick={() => navigate('/evaluations')}>取消</Button>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
            创建并开始测评
          </Button>
        </div>
      </Form>
    </div>
  );
}
