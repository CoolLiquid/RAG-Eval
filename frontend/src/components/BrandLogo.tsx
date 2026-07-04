import { Typography } from 'antd';
import { colors, rounded, typography } from '@/tokens';

const { Text } = Typography;

type BrandLogoProps = {
  showSubtitle?: boolean;
  size?: 'default' | 'large';
};

export function BrandLogo({ showSubtitle = false, size = 'default' }: BrandLogoProps) {
  const iconSize = size === 'large' ? 40 : 32;
  const titleSize = size === 'large' ? typography.titleSm.fontSize : typography.titleSm.fontSize;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: rounded.default,
          background: colors.primaryContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width={iconSize * 0.5} height={iconSize * 0.5} viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" fill={colors.onPrimary} />
          <rect x="9" y="1" width="6" height="6" rx="1" fill={colors.onPrimary} />
          <rect x="1" y="9" width="6" height="6" rx="1" fill={colors.onPrimary} />
          <rect x="9" y="9" width="6" height="6" rx="1" fill={colors.onPrimary} />
        </svg>
      </div>
      <div>
        <Text strong style={{ fontSize: titleSize, color: colors.onSurface, lineHeight: 1.2 }}>
          KB Eval
        </Text>
        {showSubtitle && (
          <>
            <br />
            <Text type="secondary" style={{ fontSize: typography.labelSm.fontSize }}>
              知识库测评
            </Text>
          </>
        )}
      </div>
    </div>
  );
}
