import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Space, Tag, Typography } from 'antd';
import type { QuestionBank } from '@/types/questionBank';
import { colors, spacing } from '@/tokens';

const { Text } = Typography;

interface QuestionBankCardProps {
  bank: QuestionBank;
  selected?: boolean;
  onPreview: (bank: QuestionBank) => void;
}

export function QuestionBankCard({ bank, selected, onPreview }: QuestionBankCardProps) {
  return (
    <Card
      hoverable
      style={{
        borderColor: selected ? colors.primary : undefined,
        boxShadow: selected ? `0 0 0 1px ${colors.primary}` : undefined,
      }}
      actions={[
        <Button
          key="preview"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => onPreview(bank)}
        >
          预览题目
        </Button>,
      ]}
    >
      <Space direction="vertical" size={spacing.sm} style={{ width: '100%' }}>
        <Space wrap>
          <Text strong>{bank.name}</Text>
          <Tag color="blue">内置</Tag>
        </Space>
        <Text type="secondary">{bank.question_count} 题</Text>
        <Space wrap size={[4, 4]}>
          {bank.categories.map((category) => (
            <Tag key={category}>{category}</Tag>
          ))}
        </Space>
      </Space>
    </Card>
  );
}
