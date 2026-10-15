import type { LocationStatus } from '@/shared/api';
import { StatusTag } from '@/shared/ui';

export const LocationStatusTag = ({ status }: { status: LocationStatus }) => (
  <StatusTag value={status} tones={{ active: 'success', inactive: 'secondary' }} />
);
