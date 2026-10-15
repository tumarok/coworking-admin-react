import { zodResolver } from '@hookform/resolvers/zod';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';

import { useCreateBookingMutation, useUpdateBookingMutation } from '@/entities/booking';
import { useGetLocationsQuery } from '@/entities/location';
import { useGetMembersQuery } from '@/entities/member';
import { useGetRoomsQuery } from '@/entities/room';
import { type Booking, bookingConflicts, errorStatus, memberFullName } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { applyServerErrors, formatTimeRange, notify } from '@/shared/lib';
import { FormDialog, FormField } from '@/shared/ui';

import {
  API_TO_FORM_FIELD,
  BOOKING_FORM_FIELDS,
  type BookingDefaults,
  type BookingFormValues,
  bookingFormSchema,
  toBookingFormValues,
  toBookingInput,
} from '../model/booking-form';

const FORM_ID = 'booking-form';
const LOCATIONS_ARG = { limit: 100 } as const;
const ROOMS_ARG = { status: 'available', limit: 100 } as const;
const MEMBERS_ARG = { status: 'active', limit: 100 } as const;

interface Props {
  booking?: Booking | null;
  defaults?: BookingDefaults;
  visible: boolean;
  onHide: () => void;
  onSaved?: (booking: Booking) => void;
}

export const BookingFormDialog = ({ booking, defaults, visible, onHide, onSaved }: Props) => {
  const { data: locations } = useGetLocationsQuery(LOCATIONS_ARG, { skip: !visible });
  const { data: rooms } = useGetRoomsQuery(ROOMS_ARG, { skip: !visible });
  const { data: members } = useGetMembersQuery(MEMBERS_ARG, { skip: !visible });
  const [create] = useCreateBookingMutation();
  const [update] = useUpdateBookingMutation();
  const [banner, setBanner] = useState<ReactNode>(null);

  const locationById = useMemo(
    () => new Map((locations?.items ?? []).map((l) => [l.id, l])),
    [locations],
  );
  const roomOptions = useMemo(
    () =>
      (rooms?.items ?? []).map((r) => ({
        value: r.id,
        label: `${r.name} · ${r.locationName} (${r.capacity} seats)`,
        locationId: r.locationId,
      })),
    [rooms],
  );
  const memberOptions = useMemo(
    () =>
      (members?.items ?? []).map((m) => ({
        value: m.id,
        label: `${memberFullName(m)} · ${m.email}`,
      })),
    [members],
  );

  const ready = Boolean(locations);
  const bookingZone = booking ? locationById.get(booking.locationId)?.timezone : undefined;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: toBookingFormValues(booking, bookingZone, defaults),
    mode: 'onTouched',
  });

  // Reset when the dialog opens (once the time zones are known), never on a background refetch.
  useEffect(() => {
    if (!visible || !ready) return;
    reset(toBookingFormValues(booking, bookingZone, defaults));
    setBanner(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ready, booking?.id, defaults?.roomId, defaults?.memberId, reset]);

  const roomId = useWatch({ control, name: 'roomId' });
  const location = useMemo(() => {
    const locationId = roomOptions.find((r) => r.value === roomId)?.locationId;
    return locationId ? locationById.get(locationId) : undefined;
  }, [roomId, roomOptions, locationById]);

  const onSubmit = handleSubmit(async (values) => {
    if (!location) {
      setBanner('Choose a room first.');
      return;
    }
    setBanner(null);
    try {
      const body = toBookingInput(values, location.timezone);
      const saved = booking
        ? await update({ id: booking.id, body }).unwrap()
        : await create(body).unwrap();
      notify.success(
        booking ? 'Booking updated' : 'Booking created',
        `${saved.roomName}, ${formatTimeRange(saved.startsAt, saved.endsAt)}`,
      );
      onSaved?.(saved);
      onHide();
    } catch (error) {
      if (errorStatus(error) === 409) {
        const conflicts = bookingConflicts(error);
        setBanner(
          <div>
            <strong>The room is already booked for this time.</strong>
            {conflicts.length > 0 ? (
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {conflicts.map((c) => (
                  <li key={c.id}>
                    <Link to={ROUTES.booking(c.id)} target="_blank">
                      {formatTimeRange(c.startsAt, c.endsAt)}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>,
        );
        return;
      }
      setBanner(applyServerErrors(error, setError, BOOKING_FORM_FIELDS, API_TO_FORM_FIELD));
    }
  });

  return (
    <FormDialog
      header={booking ? 'Edit booking' : 'New booking'}
      visible={visible}
      onHide={onHide}
      formId={FORM_ID}
      submitting={isSubmitting}
      banner={banner}
      width="44rem"
    >
      <form id={FORM_ID} className="form-grid" onSubmit={onSubmit} noValidate>
        <Controller
          name="roomId"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Room"
              htmlFor="booking-room"
              error={fieldState.error?.message}
              required
              className="span-2"
            >
              <Dropdown
                inputId="booking-room"
                value={field.value || null}
                options={roomOptions}
                placeholder="Choose a room"
                filter
                onChange={(e) => field.onChange(e.value ?? '')}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="memberId"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Member"
              htmlFor="booking-member"
              error={fieldState.error?.message}
              required
              className="span-2"
            >
              <Dropdown
                inputId="booking-member"
                value={field.value || null}
                options={memberOptions}
                placeholder="Choose a member"
                filter
                onChange={(e) => field.onChange(e.value ?? '')}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="date"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Date"
              htmlFor="booking-date"
              error={fieldState.error?.message}
              required
              hint={
                location
                  ? `${location.name} local time (${location.timezone}), open ${location.opensAt}–${location.closesAt}`
                  : undefined
              }
              className="span-2"
            >
              <InputText id="booking-date" type="date" {...field} invalid={fieldState.invalid} />
            </FormField>
          )}
        />
        <Controller
          name="startTime"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="From" htmlFor="booking-start" error={fieldState.error?.message}>
              <InputText
                id="booking-start"
                type="time"
                step={900}
                {...field}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="endTime"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="To" htmlFor="booking-end" error={fieldState.error?.message}>
              <InputText
                id="booking-end"
                type="time"
                step={900}
                {...field}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="attendees"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Attendees"
              htmlFor="booking-attendees"
              error={fieldState.error?.message}
            >
              <InputNumber
                inputId="booking-attendees"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value ?? 0)}
                onBlur={field.onBlur}
                min={1}
                showButtons
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Notes"
              htmlFor="booking-notes"
              error={fieldState.error?.message}
              className="span-2"
            >
              <InputTextarea id="booking-notes" rows={3} autoResize {...field} />
            </FormField>
          )}
        />
      </form>
    </FormDialog>
  );
};
