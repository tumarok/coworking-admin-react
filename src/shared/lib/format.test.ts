import { describe, expect, it } from 'vitest';

import { durationHours, formatMoney, formatTimeRange, humanize } from './format';

describe('format', () => {
  it('formats integer cents as currency', () => {
    expect(formatMoney(1250)).toBe('€12.50');
    expect(formatMoney(0)).toBe('€0.00');
  });

  it('collapses a same-day range into one date', () => {
    expect(formatTimeRange('2026-10-12T09:00:00.000Z', '2026-10-12T11:30:00.000Z')).toMatch(
      /^12 Oct 2026, \d{2}:\d{2}–\d{2}:\d{2}$/,
    );
  });

  it('keeps both dates for a range that crosses midnight', () => {
    const range = formatTimeRange('2026-10-12T20:00:00.000Z', '2026-10-13T02:00:00.000Z');
    expect(range).toContain('12 Oct 2026');
    expect(range).toContain('13 Oct 2026');
  });

  it('measures duration in hours', () => {
    expect(durationHours('2026-10-12T09:00:00.000Z', '2026-10-12T10:30:00.000Z')).toBe(1.5);
  });

  it('humanizes snake_case enum values', () => {
    expect(humanize('meeting_room')).toBe('Meeting room');
    expect(humanize('confirmed')).toBe('Confirmed');
  });
});
