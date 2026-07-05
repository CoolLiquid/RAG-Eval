import { Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DifficultyTag } from '@/components/question-banks/DifficultyTag';
import type { Question } from '@/types/questionBank';

const { Text } = Typography;

function truncate(text: string, max = 40): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

interface QuestionPreviewTableProps {
  questions: Question[];
  loading?: boolean;
}

export function QuestionPreviewTable({ questions, loading }: QuestionPreviewTableProps) {
  const columns: ColumnsType<Question> = [
    {
      title: '问题',
      dataIndex: 'question',
      key: 'question',
      width: '28%',
      ellipsis: true,
    },
    {
      title: '期望答案',
      dataIndex: 'expected_answer',
      key: 'expected_answer',
      width: '28%',
      render: (value: string) => (
        <Tooltip title={value}>
          <Text>{truncate(value)}</Text>
        </Tooltip>
      ),
    },
    {
      title: '类目',
      dataIndex: 'category',
      key: 'category',
      width: '14%',
      render: (value?: string | null) => value || '—',
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: '12%',
      render: (value: Question['difficulty']) => <DifficultyTag difficulty={value} />,
    },
    {
      title: '来源引用',
      dataIndex: 'source_ref',
      key: 'source_ref',
      width: '18%',
      ellipsis: true,
      render: (value?: string | null) => value || '—',
    },
  ];

  return (
    <Table<Question>
      rowKey="id"
      columns={columns}
      dataSource={questions}
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 题` }}
      scroll={{ x: 900 }}
      size="middle"
    />
  );
}
