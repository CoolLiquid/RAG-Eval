import { PagePlaceholder } from '@/components/PagePlaceholder';
import { useParams } from 'react-router-dom';

export function EvaluationReportPage() {
  const { id } = useParams();

  return (
    <PagePlaceholder
      title={`测评报告 (${id})`}
      description="综合得分、失败归因、逐题详情与 MCP 调用证据"
      priority="P0"
    />
  );
}
