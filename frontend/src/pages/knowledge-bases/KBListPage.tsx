import {
  DeleteOutlined,
  EditOutlined,
  ExperimentOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteKb,
  fetchKbList,
  testKbConnection,
  trialKbSearch,
} from '@/api/kb';
import { ChunkPreviewCard } from '@/components/kb/ChunkPreviewCard';
import { kbStatusOptions, KbStatusBadge } from '@/components/kb/KbStatusBadge';
import type { Chunk, KnowledgeBase, KbStatus } from '@/types/kb';
import { colors, fontFamily, spacing } from '@/tokens';

const { Title, Text, Paragraph } = Typography;

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('zh-CN');
}

function truncateEndpoint(endpoint: string, max = 40): string {
  if (endpoint.length <= max) return endpoint;
  return `${endpoint.slice(0, max - 3)}...`;
}

export function KBListPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<KbStatus | ''>('');
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [trialQuery, setTrialQuery] = useState('退货政策是什么');
  const [trialKb, setTrialKb] = useState<KnowledgeBase | null>(null);
  const [trialResults, setTrialResults] = useState<Chunk[]>([]);
  const [trialLoading, setTrialLoading] = useState(false);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter || undefined,
    }),
    [search, statusFilter],
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['kb', filters],
    queryFn: () => fetchKbList(filters),
  });

  const testMutation = useMutation({
    mutationFn: testKbConnection,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['kb'] });
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    },
    onError: () => message.error('测试连接失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb'] });
      message.success('已删除知识库');
    },
    onError: () => message.error('删除失败'),
  });

  const openTrialModal = (record: KnowledgeBase) => {
    setTrialKb(record);
    setTrialResults([]);
    setTrialQuery('退货政策是什么');
    setTrialModalOpen(true);
  };

  const handleTrialSearch = async () => {
    if (!trialKb || !trialQuery.trim()) return;
    setTrialLoading(true);
    try {
      const result = await trialKbSearch(trialKb.id, trialQuery.trim());
      setTrialResults(result.chunks);
      if (result.count === 0) {
        message.info('调用成功，返回 0 条结果');
      }
    } catch {
      message.error('试检索失败，请确认已选择检索 Tool 且连接正常');
    } finally {
      setTrialLoading(false);
    }
  };

  const columns: ColumnsType<KnowledgeBase> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
    },
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (endpoint: string, record) => (
        <Tooltip title={endpoint}>
          <Text style={{ fontFamily: fontFamily.mono, fontSize: 12 }}>
            {truncateEndpoint(endpoint)}
            {record.status === 'failed' && (
              <Text type="danger" style={{ marginLeft: 8, fontSize: 12 }}>
                连接异常
              </Text>
            )}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '检索 Tool',
      dataIndex: 'retrieval_tool',
      key: 'retrieval_tool',
      width: 120,
      render: (tool: string | null) =>
        tool ? <Tag color={colors.primaryContainer}>{tool}</Tag> : '—',
    },
    {
      title: '鉴权',
      dataIndex: 'auth_display',
      key: 'auth_display',
      width: 180,
      ellipsis: true,
      render: (display: string) => (
        <Tooltip title={display}>
          <Text style={{ fontSize: 12 }}>{display}</Text>
        </Tooltip>
      ),
    },
    {
      title: '连接状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: KbStatus) => <KbStatusBadge status={status} />,
    },
    {
      title: '最近测试时间',
      dataIndex: 'last_tested_at',
      key: 'last_tested_at',
      width: 170,
      render: formatDateTime,
    },
    {
      title: '操作',
      key: 'actions',
      width: 320,
      render: (_, record) => (
        <Space size={4} wrap>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/knowledge-bases/new?edit=${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            loading={testMutation.isPending && testMutation.variables === record.id}
            onClick={() => testMutation.mutate(record.id)}
          >
            测试连接
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SearchOutlined />}
            disabled={record.status !== 'connected'}
            onClick={() => openTrialModal(record)}
          >
            试检索
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ExperimentOutlined />}
            disabled={record.status !== 'connected'}
            onClick={() => navigate(`/evaluations/new?kbId=${record.id}`)}
          >
            发起测评
          </Button>
          <Popconfirm
            title="确认删除该知识库？"
            description="删除后无法恢复，相关测评任务将无法引用。"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.lg,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            MCP 知识库
          </Title>
          <Paragraph type="secondary" style={{ marginTop: spacing.xs, marginBottom: 0 }}>
            管理已挂载的远程 MCP 知识库实例
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/knowledge-bases/new')}
        >
          挂载 MCP 知识库
        </Button>
      </div>

      <Space style={{ marginBottom: spacing.md }} wrap>
        <Input.Search
          placeholder="搜索名称或 Endpoint"
          allowClear
          style={{ width: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          style={{ width: 140 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={kbStatusOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
        <Button
          icon={<ReloadOutlined />}
          loading={isFetching}
          onClick={() => refetch()}
        >
          刷新
        </Button>
      </Space>

      <Table<KnowledgeBase>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        pagination={{
          total: data?.total ?? 0,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          defaultPageSize: 10,
        }}
        scroll={{ x: 1280 }}
      />

      <Modal
        title={`试检索 — ${trialKb?.name ?? ''}`}
        open={trialModalOpen}
        onCancel={() => setTrialModalOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Space.Compact style={{ width: '100%', marginBottom: spacing.md }}>
          <Input
            placeholder="输入测试问题"
            value={trialQuery}
            onChange={(e) => setTrialQuery(e.target.value)}
            onPressEnter={handleTrialSearch}
          />
          <Button type="primary" loading={trialLoading} onClick={handleTrialSearch}>
            执行试检索
          </Button>
        </Space.Compact>
        {trialResults.length === 0 && !trialLoading && (
          <div
            style={{
              padding: spacing.lg,
              textAlign: 'center',
              background: colors.surfaceContainerLow,
              borderRadius: 8,
              color: colors.onSurfaceVariant,
            }}
          >
            输入问题后点击「执行试检索」预览知识片段
          </div>
        )}
        {trialResults.map((chunk, index) => (
          <ChunkPreviewCard key={`${chunk.source}-${index}`} chunk={chunk} />
        ))}
      </Modal>
    </div>
  );
}
