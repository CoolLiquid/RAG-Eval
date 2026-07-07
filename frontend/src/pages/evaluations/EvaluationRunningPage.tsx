import { ArrowLeftOutlined, StopOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Popconfirm,
  Progress,
  Space,
  Spin,
  Typography,
} from 'antd';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cancelEvaluation, fetchEvaluationById } from '@/api/evaluations';
import { EvaluationStatusBadge } from '@/components/evaluations/EvaluationStatusBadge';
import { spacing } from '@/tokens';

const { Title, Paragraph, Text } = Typography;

export function EvaluationRunningPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { data: task, isLoading, isError } = useQuery({
    queryKey: ['evaluations', id],
    queryFn: () => fetchEvaluationById(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'running' || status === 'pending') return 2000;
      return false;
    },
  });

  useEffect(() => {
    if (!task) return;
    if (task.status === 'completed' || task.status === 'failed') {
      navigate(`/evaluations/${task.id}/report`, { replace: true });
    }
  }, [task, navigate]);

  const cancelMutation = useMutation({
    mutationFn: () => cancelEvaluation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', id] });
      message.success('已请求取消任务');
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const detail = error.response?.data?.detail;
      message.error(typeof detail === 'string' ? detail : '取消失败');
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: spacing.xl }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !task) {
    return <Alert type="error" message="测评任务不存在或加载失败" showIcon />;
  }

  const isActive = task.status === 'running' || task.status === 'pending';

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
                {task.name}
              </Title>
              <EvaluationStatusBadge status={task.status} />
            </Space>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              异步批量执行中，页面将自动刷新进度
            </Paragraph>
          </div>
          {isActive && (
            <Popconfirm
              title="确定取消该测评任务？"
              description="取消后已完成的题目结果会保留"
              onConfirm={() => cancelMutation.mutate()}
              okText="取消任务"
              cancelText="继续运行"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<StopOutlined />} loading={cancelMutation.isPending}>
                取消任务
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      <Card>
        <Progress
          percent={task.progress}
          status={task.status === 'failed' ? 'exception' : task.status === 'cancelled' ? 'exception' : 'active'}
          format={() => `${task.completed_questions} / ${task.total_questions}`}
        />
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} style={{ marginTop: spacing.lg }}>
          <Descriptions.Item label="MCP 知识库">{task.kb_name}</Descriptions.Item>
          <Descriptions.Item label="测评题库">{task.question_bank_name}</Descriptions.Item>
          <Descriptions.Item label="测评模式">
            {task.mode === 'retrieval_only' ? '检索测评' : 'RAG 全链路'}
          </Descriptions.Item>
          <Descriptions.Item label="Top-K">{task.config.top_k}</Descriptions.Item>
          <Descriptions.Item label="通过阈值">{task.config.pass_threshold}</Descriptions.Item>
          <Descriptions.Item label="评分方式">
            {task.config.scoring_method === 'llm_judge' ? 'LLM 裁判' : '语义相似度'}
          </Descriptions.Item>
        </Descriptions>
        {task.error_message && (
          <Alert type="error" message={task.error_message} showIcon style={{ marginTop: spacing.md }} />
        )}
        {isActive && (
          <Text type="secondary" style={{ display: 'block', marginTop: spacing.md }}>
            正在逐题调用 MCP 检索并评分，请稍候…
          </Text>
        )}
      </Card>
    </div>
  );
}
