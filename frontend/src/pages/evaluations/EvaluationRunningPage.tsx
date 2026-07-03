import { PagePlaceholder } from '@/components/PagePlaceholder';
import { useParams } from 'react-router-dom';

export function EvaluationRunningPage() {
  const { id } = useParams();

  return (
    <PagePlaceholder
      title={`测评进行中 (${id})`}
      description="异步批量执行，展示进度与实时日志"
      priority="P0"
    />
  );
}
