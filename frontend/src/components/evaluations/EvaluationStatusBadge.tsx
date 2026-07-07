import { Tag } from 'antd';
import type { EvaluationStatus } from '@/types/evaluation';
import { EVALUATION_STATUS_LABELS } from '@/types/evaluation';
import { semantic } from '@/tokens';

const STATUS_COLORS: Record<EvaluationStatus, string> = {
  pending: 'default',
  running: 'processing',
  completed: 'success',
  failed: 'error',
  cancelled: 'warning',
};

interface EvaluationStatusBadgeProps {
  status: EvaluationStatus;
}

export function EvaluationStatusBadge({ status }: EvaluationStatusBadgeProps) {
  return (
    <Tag color={STATUS_COLORS[status]} style={status === 'running' ? { color: semantic.warning } : undefined}>
      {EVALUATION_STATUS_LABELS[status]}
    </Tag>
  );
}
