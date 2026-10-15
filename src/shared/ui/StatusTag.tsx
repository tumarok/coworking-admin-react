import { Tag } from 'primereact/tag';

import { humanize } from '@/shared/lib/format';

export type Tone = 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';

interface Props<V extends string> {
  value: V;
  /** Colour per value; values without a tone render neutral. */
  tones: Partial<Record<V, Tone>>;
}

export const StatusTag = <V extends string>({ value, tones }: Props<V>) => (
  <Tag value={humanize(value)} severity={tones[value] ?? 'secondary'} rounded />
);
