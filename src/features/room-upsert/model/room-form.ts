import { z } from 'zod';

import { type Room, type RoomInput, roomInputSchema } from '@/shared/api';

/** The form edits the hourly rate in euros; the API stores cents. */
export const roomFormSchema = roomInputSchema.extend({
  locationId: z.string().min(1, { error: 'Choose a location' }),
  hourlyRate: z
    .number({ error: 'Enter a rate' })
    .min(0, { error: 'Cannot be negative' })
    .max(10_000),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;

export const toRoomFormValues = (room?: Room | null, locationId = ''): RoomFormValues =>
  room
    ? {
        locationId: room.locationId,
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        hourlyRate: room.hourlyRate / 100,
        amenities: room.amenities,
        status: room.status,
      }
    : {
        locationId,
        name: '',
        type: 'meeting_room',
        capacity: 6,
        hourlyRate: 25,
        amenities: [],
        status: 'available',
      };

export const toRoomInput = (values: RoomFormValues): RoomInput => ({
  ...values,
  hourlyRate: Math.round(values.hourlyRate * 100),
});
