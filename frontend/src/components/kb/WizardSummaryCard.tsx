import { Button, Card, Descriptions, Typography } from 'antd';
import { formatAuthDisplay } from '@/components/kb/authConfig';
import type { AuthType } from '@/types/kb';
import { colors, fontFamily, rounded, spacing } from '@/tokens';

const { Text } = Typography;

interface WizardSummaryCardProps {
  name?: string;
  endpoint?: string;
  retrievalTool?: string;
  authType?: AuthType;
  authHeaderName?: string | null;
  authSecretMasked?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionDisabled?: boolean;
}

function truncateUrl(url: string, max = 36): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 3)}...`;
}

export function WizardSummaryCard({
  name,
  endpoint,
  retrievalTool,
  authType,
  authHeaderName,
  authSecretMasked,
  actionLabel,
  onAction,
  actionLoading,
  actionDisabled,
}: WizardSummaryCardProps) {
  const authDisplay =
    authType && authSecretMasked
      ? formatAuthDisplay(authType, authSecretMasked, authHeaderName)
      : authType === 'none'
        ? '无鉴权'
        : '—';

  return (
    <Card
      title="配置摘要"
      style={{
        borderRadius: rounded.default,
        borderColor: colors.outlineVariant,
        position: 'sticky',
        top: spacing.lg,
      }}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="名称">{name || '—'}</Descriptions.Item>
        <Descriptions.Item label="Endpoint">
          {endpoint ? (
            <Text style={{ fontFamily: fontFamily.mono, fontSize: 12 }}>
              {truncateUrl(endpoint)}
            </Text>
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="检索 Tool">
          {retrievalTool || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="鉴权">{authDisplay}</Descriptions.Item>
      </Descriptions>
      {actionLabel && onAction && (
        <Button
          type="primary"
          block
          style={{ marginTop: spacing.md }}
          onClick={onAction}
          loading={actionLoading}
          disabled={actionDisabled}
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
