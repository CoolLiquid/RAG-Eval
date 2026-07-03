import { Alert, Typography } from 'antd';
import type { PagePriority } from '@/types';

const { Title, Paragraph } = Typography;

interface PagePlaceholderProps {
  title: string;
  description: string;
  priority: PagePriority;
}

export function PagePlaceholder({ title, description, priority }: PagePlaceholderProps) {
  return (
    <div>
      <Title level={2}>{title}</Title>
      <Paragraph type="secondary">{description}</Paragraph>
      <Alert
        message="开发中"
        description={`该页面为 Phase 0 占位页（${priority}），后续将对照 Stitch 原型逐步实现。`}
        type="info"
        showIcon
      />
    </div>
  );
}
