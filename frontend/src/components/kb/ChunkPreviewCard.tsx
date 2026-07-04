import { Card, Typography } from 'antd';
import type { Chunk } from '@/types/kb';
import { colors, fontFamily, rounded, spacing } from '@/tokens';

const { Text, Paragraph } = Typography;

interface ChunkPreviewCardProps {
  chunk: Chunk;
}

export function ChunkPreviewCard({ chunk }: ChunkPreviewCardProps) {
  return (
    <Card
      size="small"
      style={{
        borderRadius: rounded.default,
        borderColor: colors.outlineVariant,
        marginBottom: spacing.sm,
      }}
    >
      <Paragraph
        ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
        style={{ marginBottom: spacing.sm }}
      >
        {chunk.content}
      </Paragraph>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.sm }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {chunk.title ?? chunk.source}
        </Text>
        {chunk.score != null && (
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 12,
              color: colors.primary,
            }}
          >
            {chunk.score.toFixed(2)}
          </Text>
        )}
      </div>
    </Card>
  );
}
