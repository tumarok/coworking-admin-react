import { z } from 'zod';

import {
  type Booking,
  type BookingInput,
  MAX_BOOKING_HOURS,
  isoDateSchema,
  timeOfDaySchema,
} from '@/shared/api';
import { utcToZoned, zonedToUtcIso } from '@/shared/lib';

const minutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * What the form edits: a calendar date and two wall-clock times in the location's time zone.
 * Capacity, opening hours and overlaps are checked by the server, which knows the current data.
 */
export const bookingFormSchema = z
  .object({
    roomId: z.string().min(1, { error: 'Choose a room' }),
    memberId: z.string().min(1, { error: 'Choose a member' }),
    date: isoDateSchema.or(z.literal('')).refine((v) => v !== '', { error: 'Pick a date' }),
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema,
    attendees: z.number({ error: 'Enter a number' }).int().min(1, { error: 'At least 1 person' }),
    notes: z.string().trim().max(500),
  })
  .superRefine((v, ctx) => {
    const length = minutes(v.endTime) - minutes(v.startTime);
    if (length <= 0) {
      ctx.addIssue({ code: 'custom', message: 'End must be after start', path: ['endTime'] });
    } else if (length > MAX_BOOKING_HOURS * 60) {
      ctx.addIssue({
        code: 'custom',
        message: `A booking cannot be longer than ${MAX_BOOKING_HOURS} hours`,
        path: ['endTime'],
      });
    }
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const BOOKING_FORM_FIELDS = [
  'roomId',
  'memberId',
  'date',
  'startTime',
  'endTime',
  'attendees',
  'notes',
] as const;

/** API field names that the form shows under different fields. */
export const API_TO_FORM_FIELD = { startsAt: 'startTime', endsAt: 'endTime' };

export interface BookingDefaults {
  roomId?: string;
  memberId?: string;
}

export const toBookingFormValues = (
  booking: Booking | null | undefined,
  timeZone: string | undefined,
  defaults: BookingDefaults = {},
): BookingFormValues => {
  if (booking && timeZone) {
    const start = utcToZoned(booking.startsAt, timeZone);
    const end = utcToZoned(booking.endsAt, timeZone);
    return {
      roomId: booking.roomId,
      memberId: booking.memberId,
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      attendees: booking.attendees,
      notes: booking.notes ?? '',
    };
  }
  return {
    roomId: defaults.roomId ?? '',
    memberId: defaults.memberId ?? '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    attendees: 1,
    notes: '',
  };
};

export const toBookingInput = (values: BookingFormValues, timeZone: string): BookingInput => ({
  roomId: values.roomId,
  memberId: values.memberId,
  startsAt: zonedToUtcIso(values.date, values.startTime, timeZone),
  endsAt: zonedToUtcIso(values.date, values.endTime, timeZone),
  attendees: values.attendees,
  notes: values.notes || null,
});
