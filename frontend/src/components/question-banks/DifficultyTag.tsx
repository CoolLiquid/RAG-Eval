import { Tag } from 'antd';
import type { QuestionDifficulty } from '@/types/questionBank';

const difficultyConfig: Record<
  QuestionDifficulty,
  { color: string; label: string }
> = {
  easy: { color: 'success', label: '简单' },
  medium: { color: 'warning', label: '中等' },
  hard: { color: 'error', label: '困难' },
};

interface DifficultyTagProps {
  difficulty?: QuestionDifficulty | null;
}

export function DifficultyTag({ difficulty }: DifficultyTagProps) {
  if (!difficulty) {
    return <Tag>—</Tag>;
  }
  const config = difficultyConfig[difficulty];
  return <Tag color={config.color}>{config.label}</Tag>;
}
