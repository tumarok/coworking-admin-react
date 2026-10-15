import type { BookingStatus } from '@/shared/api';
import { StatusTag } from '@/shared/ui';

export const BookingStatusTag = ({ status }: { status: BookingStatus }) => (
  <StatusTag
    value={status}
    tones={{
      pending: 'warning',
      confirmed: 'info',
      checked_in: 'success',
      completed: 'contrast',
      cancelled: 'secondary',
      no_show: 'danger',
    }}
  />
);
