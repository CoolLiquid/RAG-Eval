import { Tag } from 'antd';
import type { FailureType } from '@/types/evaluation';
import { FAILURE_TYPE_LABELS } from '@/types/evaluation';

const FAILURE_COLORS: Record<FailureType, string> = {
  mcp_error: 'purple',
  no_recall: 'gold',
  wrong_answer: 'red',
  hallucination: 'magenta',
  incomplete: 'blue',
  mapping_error: 'orange',
};

interface FailureTypeTagProps {
  type: FailureType;
}

export function FailureTypeTag({ type }: FailureTypeTagProps) {
  return <Tag color={FAILURE_COLORS[type]}>{FAILURE_TYPE_LABELS[type]}</Tag>;
}
