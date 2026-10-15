import type { RoomStatus } from '@/shared/api';
import { StatusTag } from '@/shared/ui';

export const RoomStatusTag = ({ status }: { status: RoomStatus }) => (
  <StatusTag
    value={status}
    tones={{ available: 'success', maintenance: 'warning', retired: 'secondary' }}
  />
);
