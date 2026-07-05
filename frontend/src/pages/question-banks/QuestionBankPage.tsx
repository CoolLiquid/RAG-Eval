import {
  DeleteOutlined,
  ExperimentOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Col,
  Empty,
  Input,
  Popconfirm,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteQuestionBank,
  fetchQuestionBankById,
  fetchQuestionBankList,
  importQuestionBankCsv,
} from '@/api/questionBanks';
import { CsvUploadZone } from '@/components/question-banks/CsvUploadZone';
import { QuestionBankCard } from '@/components/question-banks/QuestionBankCard';
import { QuestionPreviewTable } from '@/components/question-banks/QuestionPreviewTable';
import type { QuestionBank, QuestionBankType } from '@/types/questionBank';
import { colors, spacing } from '@/tokens';

const { Title, Paragraph, Text } = Typography;

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN');
}

export function QuestionBankPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<QuestionBankType>('builtin');
  const [search, setSearch] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      type: activeTab,
      search: search.trim() || undefined,
    }),
    [activeTab, search],
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['question-banks', filters],
    queryFn: () => fetchQuestionBankList(filters),
  });

  const { data: selectedDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['question-banks', selectedBankId],
    queryFn: () => fetchQuestionBankById(selectedBankId!),
    enabled: Boolean(selectedBankId),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => importQuestionBankCsv(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      setSelectedBankId(result.bank.id);
      setActiveTab('custom');
      const skipped = result.skipped_rows.length;
      if (skipped > 0) {
        message.warning(`导入成功 ${result.imported_count} 题，跳过 ${skipped} 行`);
      } else {
        message.success(`导入成功，共 ${result.imported_count} 题`);
      }
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const detail = error.response?.data?.detail;
      message.error(typeof detail === 'string' ? detail : 'CSV 导入失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuestionBank,
    onSuccess: (_, bankId) => {
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      if (selectedBankId === bankId) {
        setSelectedBankId(null);
      }
      message.success('已删除题库');
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const detail = error.response?.data?.detail;
      message.error(typeof detail === 'string' ? detail : '删除失败');
    },
  });

  const handlePreview = (bank: QuestionBank) => {
    setSelectedBankId(bank.id);
  };

  const handleStartEvaluation = () => {
    if (!selectedBankId) {
      message.warning('请先选择题库');
      return;
    }
    navigate(`/evaluations/new?questionBankId=${selectedBankId}`);
  };

  const customColumns: ColumnsType<QuestionBank> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '题数',
      dataIndex: 'question_count',
      key: 'question_count',
      width: 80,
    },
    {
      title: '类目',
      dataIndex: 'categories',
      key: 'categories',
      render: (categories: string[]) => (
        <Space wrap size={[4, 4]}>
          {categories.map((category) => (
            <Tag key={category}>{category}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '导入时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: formatDateTime,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Popconfirm
            title="确定删除该题库？"
            description="删除后不可恢复（重启服务后自定义题库也会丢失）"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending && deleteMutation.variables === record.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const banks = data?.items ?? [];
  const selectedBank =
    selectedDetail ?? banks.find((bank) => bank.id === selectedBankId) ?? null;

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
            测评题库
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            内置题库与 CSV 自定义题库管理，选择题库后可发起测评
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<ExperimentOutlined />}
          disabled={!selectedBankId}
          onClick={handleStartEvaluation}
        >
          使用该题库发起测评
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as QuestionBankType);
          setSelectedBankId(null);
        }}
        items={[
          { key: 'builtin', label: '内置题库' },
          { key: 'custom', label: '自定义题库' },
        ]}
      />

      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="搜索题库名称或类目"
          allowClear
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
          刷新
        </Button>
      </Space>

      {activeTab === 'builtin' ? (
        <Row gutter={[spacing.md, spacing.md]}>
          {banks.map((bank) => (
            <Col key={bank.id} xs={24} md={12}>
              <QuestionBankCard
                bank={bank}
                selected={selectedBankId === bank.id}
                onPreview={handlePreview}
              />
            </Col>
          ))}
          {!isLoading && banks.length === 0 && (
            <Col span={24}>
              <Empty description="暂无内置题库" />
            </Col>
          )}
        </Row>
      ) : (
        <Space direction="vertical" size={spacing.lg} style={{ width: '100%' }}>
          <CsvUploadZone
            uploading={importMutation.isPending}
            onUpload={(file) => importMutation.mutate(file)}
          />
          <Table<QuestionBank>
            rowKey="id"
            columns={customColumns}
            dataSource={banks}
            loading={isLoading}
            pagination={false}
            locale={{ emptyText: '暂无自定义题库，请上传 CSV 导入' }}
            onRow={(record) => ({
              onClick: () => setSelectedBankId(record.id),
              style: {
                cursor: 'pointer',
                background: selectedBankId === record.id ? colors.surfaceContainerLow : undefined,
              },
            })}
          />
        </Space>
      )}

      {selectedBankId && (
        <div
          style={{
            borderTop: `1px solid ${colors.outlineVariant}`,
            paddingTop: spacing.lg,
          }}
        >
          <Space direction="vertical" size={spacing.md} style={{ width: '100%' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: spacing.sm,
              }}
            >
              <div>
                <Title level={5} style={{ marginBottom: spacing.xs }}>
                  题目预览 — {selectedBank?.name ?? '加载中...'}
                </Title>
                {selectedBank && (
                  <Text type="secondary">
                    共 {selectedBank.question_count} 题
                    {selectedBank.categories.length > 0 &&
                      ` · ${selectedBank.categories.join(' / ')}`}
                  </Text>
                )}
              </div>
              <Button type="primary" icon={<ExperimentOutlined />} onClick={handleStartEvaluation}>
                使用该题库发起测评
              </Button>
            </div>
            <QuestionPreviewTable
              questions={selectedDetail?.questions ?? []}
              loading={detailLoading}
            />
          </Space>
        </div>
      )}
    </div>
  );
}
