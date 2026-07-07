import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchEvaluationReport, fetchEvaluationResults } from '@/api/evaluations';
import { ChunkPreviewCard } from '@/components/kb/ChunkPreviewCard';
import { EvaluationStatusBadge } from '@/components/evaluations/EvaluationStatusBadge';
import { FailureTypeTag } from '@/components/evaluations/FailureTypeTag';
import type { EvaluationResult } from '@/types/evaluation';
import { colors, fontFamily, spacing } from '@/tokens';

const { Title, Paragraph, Text } = Typography;

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('zh-CN');
}

export function EvaluationReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: report,
    isLoading: reportLoading,
    isError: reportError,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ['evaluations', id, 'report'],
    queryFn: () => fetchEvaluationReport(id!),
    enabled: Boolean(id),
    retry: false,
  });

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['evaluations', id, 'results'],
    queryFn: () => fetchEvaluationResults(id!, 1, 100),
    enabled: Boolean(id) && Boolean(report),
  });

  if (reportLoading) {
    return (
      <div style={{ textAlign: 'center', padding: spacing.xl }}>
        <Spin size="large" tip="加载报告中..." />
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div>
        <Alert
          type="warning"
          message="报告暂不可用"
          description="测评可能尚未完成，请前往进度页查看"
          showIcon
          action={
            <Button size="small" onClick={() => navigate(`/evaluations/${id}/running`)}>
              查看进度
            </Button>
          }
        />
      </div>
    );
  }

  const { summary } = report;
  const topFailures = Object.entries(report.failure_distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const columns: ColumnsType<EvaluationResult> = [
    {
      title: '问题',
      dataIndex: 'question',
      key: 'question',
      width: 220,
      ellipsis: true,
    },
    {
      title: '类目',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 70,
      render: (score: number) => score.toFixed(1),
    },
    {
      title: '状态',
      dataIndex: 'passed',
      key: 'passed',
      width: 80,
      render: (passed: boolean) => (
        <Tag color={passed ? 'success' : 'error'}>{passed ? '通过' : '未通过'}</Tag>
      ),
    },
    {
      title: '失败类型',
      dataIndex: 'failure_type',
      key: 'failure_type',
      width: 110,
      render: (type: EvaluationResult['failure_type']) =>
        type ? <FailureTypeTag type={type} /> : '—',
    },
    {
      title: 'MCP 时延',
      dataIndex: 'latency_ms',
      key: 'latency_ms',
      width: 90,
      render: (ms: number) => `${ms}ms`,
    },
  ];

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: spacing.md,
          }}
        >
          <div>
            <Space align="center" style={{ marginBottom: spacing.xs }}>
              <Title level={3} style={{ marginBottom: 0 }}>
                {report.task_name} 报告
              </Title>
              <EvaluationStatusBadge status={report.status} />
            </Space>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              MCP: {report.kb_name} · 题库: {report.question_bank_name} · 模式:{' '}
              {report.mode === 'retrieval_only' ? '检索测评' : 'RAG 全链路'} · 完成于{' '}
              {formatDateTime(report.completed_at)}
            </Paragraph>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetchReport()}>
              刷新
            </Button>
            <Button onClick={() => navigate('/evaluations/new')}>重新测评</Button>
          </Space>
        </div>
      </div>

      <Row gutter={[spacing.md, spacing.md]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="综合得分" value={summary.overall_score} suffix="/ 100" precision={1} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="通过率" value={summary.pass_rate * 100} suffix="%" precision={1} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="召回率" value={summary.recall_rate * 100} suffix="%" precision={1} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均 MCP 时延"
              value={summary.avg_mcp_latency_ms}
              suffix="ms"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[spacing.md, spacing.md]}>
        <Col xs={24} lg={16}>
          {report.category_scores.length > 0 && (
            <Card title="类目得分分布" style={{ marginBottom: spacing.md }}>
              <Table
                rowKey="category"
                size="small"
                pagination={false}
                dataSource={report.category_scores}
                columns={[
                  { title: '类目', dataIndex: 'category', key: 'category' },
                  {
                    title: '得分',
                    dataIndex: 'score',
                    key: 'score',
                    render: (v: number) => v.toFixed(1),
                  },
                  {
                    title: '通过率',
                    dataIndex: 'pass_rate',
                    key: 'pass_rate',
                    render: (v: number) => `${(v * 100).toFixed(1)}%`,
                  },
                  { title: '题数', dataIndex: 'total', key: 'total' },
                ]}
              />
            </Card>
          )}

          <Card title="逐题详情">
            <Table<EvaluationResult>
              rowKey="id"
              size="small"
              loading={resultsLoading}
              columns={columns}
              dataSource={resultsData?.items ?? []}
              pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 题` }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: spacing.sm }}>
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="期望答案">{record.expected_answer}</Descriptions.Item>
                      <Descriptions.Item label="失败说明">
                        {record.failure_reason ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="MCP Tool">{record.mcp_tool}</Descriptions.Item>
                      <Descriptions.Item label="请求参数">
                        <Text code style={{ fontFamily: fontFamily.mono, whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(record.mcp_request, null, 2)}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                    {record.chunks.length > 0 && (
                      <div style={{ marginTop: spacing.md }}>
                        <Text strong>检索片段</Text>
                        {record.chunks.map((chunk, idx) => (
                          <ChunkPreviewCard
                            key={`${record.id}-chunk-${idx}`}
                            chunk={{
                              content: chunk.content,
                              source: chunk.source,
                              title: chunk.title ?? undefined,
                              score: chunk.score ?? undefined,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {record.mcp_response_raw && (
                      <Collapse
                        style={{ marginTop: spacing.md }}
                        items={[
                          {
                            key: 'raw',
                            label: 'MCP 原始响应',
                            children: (
                              <pre
                                style={{
                                  margin: 0,
                                  fontFamily: fontFamily.mono,
                                  fontSize: 12,
                                  overflow: 'auto',
                                  maxHeight: 240,
                                  background: colors.surfaceContainerLow,
                                  padding: spacing.sm,
                                  borderRadius: 4,
                                }}
                              >
                                {JSON.stringify(record.mcp_response_raw, null, 2)}
                              </pre>
                            ),
                          },
                        ]}
                      />
                    )}
                  </div>
                ),
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="失败原因分布">
            {Object.keys(report.failure_distribution).length === 0 ? (
              <Text type="secondary">全部通过，无失败记录</Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(report.failure_distribution).map(([type, count]) => (
                  <div
                    key={type}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <FailureTypeTag type={type as EvaluationResult['failure_type'] & string} />
                    <Text>{count} 题</Text>
                  </div>
                ))}
              </Space>
            )}
          </Card>

          {topFailures.length > 0 && (
            <Card title="Top 3 失败原因" style={{ marginTop: spacing.md }}>
              <ol style={{ paddingLeft: spacing.lg, margin: 0 }}>
                {topFailures.map(([type, count]) => (
                  <li key={type} style={{ marginBottom: spacing.sm }}>
                    <FailureTypeTag type={type as EvaluationResult['failure_type'] & string} />{' '}
                    <Text type="secondary">({count} 题)</Text>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <Card title="任务摘要" style={{ marginTop: spacing.md }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="总题数">{summary.total_questions}</Descriptions.Item>
              <Descriptions.Item label="通过">{summary.passed}</Descriptions.Item>
              <Descriptions.Item label="未通过">{summary.failed}</Descriptions.Item>
              <Descriptions.Item label="MCP 成功率">
                {(summary.mcp_success_rate * 100).toFixed(1)}%
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
