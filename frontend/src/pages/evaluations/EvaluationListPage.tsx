import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvaluationList } from '@/api/evaluations';
import { EvaluationStatusBadge } from '@/components/evaluations/EvaluationStatusBadge';
import type { Evaluation } from '@/types/evaluation';
import { spacing } from '@/tokens';

const { Title, Paragraph } = Typography;

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('zh-CN');
}

function formatPercent(value: number | null): string {
  if (value == null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export function EvaluationListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filters = useMemo(
    () => ({ search: search.trim() || undefined }),
    [search],
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['evaluations', filters],
    queryFn: () => fetchEvaluationList(filters),
  });

  const columns: ColumnsType<Evaluation> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'MCP 知识库',
      dataIndex: 'kb_name',
      key: 'kb_name',
      width: 140,
    },
    {
      title: '题库',
      dataIndex: 'question_bank_name',
      key: 'question_bank_name',
      width: 160,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Evaluation['status']) => <EvaluationStatusBadge status={status} />,
    },
    {
      title: '综合得分',
      dataIndex: 'overall_score',
      key: 'overall_score',
      width: 100,
      render: (score: number | null) => (score != null ? score.toFixed(1) : '—'),
    },
    {
      title: '通过率',
      dataIndex: 'pass_rate',
      key: 'pass_rate',
      width: 90,
      render: formatPercent,
    },
    {
      title: '进度',
      key: 'progress',
      width: 100,
      render: (_, record) =>
        record.status === 'running'
          ? `${record.completed_questions}/${record.total_questions}`
          : record.status === 'completed'
            ? '100%'
            : `${record.progress}%`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: formatDateTime,
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => {
        if (record.status === 'running' || record.status === 'pending') {
          return (
            <Button type="link" size="small" onClick={() => navigate(`/evaluations/${record.id}/running`)}>
              查看进度
            </Button>
          );
        }
        if (record.status === 'completed' || record.status === 'failed' || record.status === 'cancelled') {
          return (
            <Button type="link" size="small" onClick={() => navigate(`/evaluations/${record.id}/report`)}>
              查看报告
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
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
          <Title level={3} style={{ marginBottom: spacing.xs }}>
            测评任务
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            查看历史测评任务列表，跟踪进度或查看报告
          </Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/evaluations/new')}>
          创建测评
        </Button>
      </div>

      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="搜索任务名称、知识库或题库"
          allowClear
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
          刷新
        </Button>
      </Space>

      <Table<Evaluation>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        locale={{ emptyText: '暂无测评任务，点击右上角创建' }}
        onRow={(record) => ({
          onDoubleClick: () => {
            if (record.status === 'running' || record.status === 'pending') {
              navigate(`/evaluations/${record.id}/running`);
            } else {
              navigate(`/evaluations/${record.id}/report`);
            }
          },
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
}
