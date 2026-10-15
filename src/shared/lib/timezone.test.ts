import { describe, expect, it } from 'vitest';

import { utcToZoned, zonedToUtcIso } from './timezone';

describe('time zones', () => {
  it('converts local wall-clock time to UTC, summer and winter', () => {
    expect(zonedToUtcIso('2026-07-01', '09:00', 'Europe/Kyiv')).toBe('2026-07-01T06:00:00.000Z');
    expect(zonedToUtcIso('2026-01-15', '09:00', 'Europe/Kyiv')).toBe('2026-01-15T07:00:00.000Z');
    expect(zonedToUtcIso('2026-07-01', '09:00', 'Europe/Lisbon')).toBe('2026-07-01T08:00:00.000Z');
  });

  it('handles the day of a DST switch', () => {
    // Clocks in Berlin go forward at 02:00 on 2026-03-29.
    expect(zonedToUtcIso('2026-03-29', '10:00', 'Europe/Berlin')).toBe('2026-03-29T08:00:00.000Z');
  });

  it('round-trips through utcToZoned', () => {
    const iso = zonedToUtcIso('2026-10-20', '14:30', 'Europe/Warsaw');
    expect(utcToZoned(iso, 'Europe/Warsaw')).toEqual({ date: '2026-10-20', time: '14:30' });
  });
});
