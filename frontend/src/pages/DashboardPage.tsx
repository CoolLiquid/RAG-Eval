import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Row, Space, Statistic, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { fetchHealth } from '@/api/client';
import { fetchEvaluationList } from '@/api/evaluations';
import { fetchKbList } from '@/api/kb';
import { EvaluationStatusBadge } from '@/components/evaluations/EvaluationStatusBadge';
import type { Evaluation } from '@/types/evaluation';

const { Text, Title, Paragraph } = Typography;

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });
  const { data: kbData } = useQuery({
    queryKey: ['kb', {}],
    queryFn: () => fetchKbList(),
  });
  const { data: evalData } = useQuery({
    queryKey: ['evaluations', {}],
    queryFn: () => fetchEvaluationList(),
  });

  const runningCount =
    evalData?.items.filter((e) => e.status === 'running' || e.status === 'pending').length ?? 0;
  const completedScores = (evalData?.items ?? [])
    .filter((e) => e.overall_score != null)
    .map((e) => e.overall_score as number);
  const avgScore =
    completedScores.length > 0
      ? (completedScores.reduce((a, b) => a + b, 0) / completedScores.length).toFixed(1)
      : '—';

  const recentColumns: ColumnsType<Evaluation> = [
    { title: '任务名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'MCP 知识库', dataIndex: 'kb_name', key: 'kb_name', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: Evaluation['status']) => <EvaluationStatusBadge status={status} />,
    },
    {
      title: '综合得分',
      dataIndex: 'overall_score',
      key: 'overall_score',
      width: 90,
      render: (score: number | null) => (score != null ? score.toFixed(1) : '—'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() =>
            navigate(
              record.status === 'running' || record.status === 'pending'
                ? `/evaluations/${record.id}/running`
                : `/evaluations/${record.id}/report`,
            )
          }
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>首页概览</Title>
      <Paragraph type="secondary">MCP 知识库测评运行状态一览</Paragraph>
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={() => navigate('/knowledge-bases/new')}>
          挂载 MCP 知识库
        </Button>
        <Button onClick={() => navigate('/evaluations/new')}>发起测评</Button>
      </Space>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="MCP 知识库" value={kbData?.total ?? 0} suffix="个" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="进行中任务" value={runningCount} suffix="个" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="最近平均得分" value={avgScore} />
          </Card>
        </Col>
      </Row>
      <Card title="最近测评任务" style={{ marginTop: 16 }}>
        <Table<Evaluation>
          rowKey="id"
          size="small"
          columns={recentColumns}
          dataSource={(evalData?.items ?? []).slice(0, 5)}
          pagination={false}
          locale={{ emptyText: '尚未发起测评，从挂载 MCP 开始' }}
        />
      </Card>
      <Card style={{ marginTop: 16 }} title="API 联调状态">
        {isLoading && <Text>检测中...</Text>}
        {isError && (
          <Alert type="error" message="后端未连接，请启动 FastAPI 服务" showIcon />
        )}
        {data && (
          <Alert
            type="success"
            message={`后端已连接：${data.status} (v${data.version})`}
            showIcon
          />
        )}
      </Card>
    </div>
  );
}
