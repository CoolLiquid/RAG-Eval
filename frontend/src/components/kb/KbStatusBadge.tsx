import { Tag } from 'antd';
import type { KbStatus } from '@/types/kb';
import { semantic } from '@/tokens';

const statusConfig: Record<
  KbStatus,
  { label: string; color: string }
> = {
  connected: { label: '已连接', color: semantic.success },
  failed: { label: '连接失败', color: '#DC2626' },
  pending: { label: '待配置', color: '#94A3B8' },
  disabled: { label: '已禁用', color: '#64748B' },
};

interface KbStatusBadgeProps {
  status: KbStatus;
}

export function KbStatusBadge({ status }: KbStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Tag
      color={config.color}
      style={{ borderRadius: 999, border: 'none', color: '#fff', fontWeight: 500 }}
    >
      {config.label}
    </Tag>
  );
}

export const kbStatusOptions = [
  { value: '', label: '全部' },
  { value: 'connected', label: '已连接' },
  { value: 'failed', label: '连接失败' },
  { value: 'pending', label: '待配置' },
  { value: 'disabled', label: '已禁用' },
] as const;
