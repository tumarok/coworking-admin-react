import type { MemberStatus } from '@/shared/api';
import { StatusTag } from '@/shared/ui';

export const MemberStatusTag = ({ status }: { status: MemberStatus }) => (
  <StatusTag
    value={status}
    tones={{ active: 'success', suspended: 'warning', cancelled: 'secondary' }}
  />
);
