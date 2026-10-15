import { zodResolver } from '@hookform/resolvers/zod';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useGetLocationsQuery } from '@/entities/location';
import { useCreateRoomMutation, useUpdateRoomMutation } from '@/entities/room';
import { AMENITIES, ROOM_STATUSES, ROOM_TYPES, type Room } from '@/shared/api';
import { applyServerErrors, enumOptions, notify } from '@/shared/lib';
import { FormDialog, FormField } from '@/shared/ui';

import {
  type RoomFormValues,
  roomFormSchema,
  toRoomFormValues,
  toRoomInput,
} from '../model/room-form';

const FIELDS = ['locationId', 'name', 'type', 'capacity', 'hourlyRate', 'amenities', 'status'];
const FORM_ID = 'room-form';
const LOCATIONS_ARG = { limit: 100 } as const;

interface Props {
  room?: Room | null;
  /** Preselected location when adding a room from a location page. */
  locationId?: string;
  visible: boolean;
  onHide: () => void;
  onSaved?: (room: Room) => void;
}

export const RoomFormDialog = ({ room, locationId, visible, onHide, onSaved }: Props) => {
  const { data: locations } = useGetLocationsQuery(LOCATIONS_ARG, { skip: !visible });
  const [create] = useCreateRoomMutation();
  const [update] = useUpdateRoomMutation();
  const [banner, setBanner] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: toRoomFormValues(room, locationId),
    mode: 'onTouched',
  });

  // Reset when the dialog opens or switches room, never on a background refetch.
  useEffect(() => {
    if (!visible) return;
    reset(toRoomFormValues(room, locationId));
    setBanner(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, room?.id, locationId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    try {
      const body = toRoomInput(values);
      const saved = room
        ? await update({ id: room.id, body }).unwrap()
        : await create(body).unwrap();
      notify.success(room ? 'Room updated' : 'Room created', saved.name);
      onSaved?.(saved);
      onHide();
    } catch (error) {
      setBanner(applyServerErrors(error, setError, FIELDS));
    }
  });

  return (
    <FormDialog
      header={room ? `Edit ${room.name}` : 'New room'}
      visible={visible}
      onHide={onHide}
      formId={FORM_ID}
      submitting={isSubmitting}
      banner={banner}
    >
      <form id={FORM_ID} className="form-grid" onSubmit={onSubmit} noValidate>
        <Controller
          name="locationId"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Location"
              htmlFor="room-location"
              error={fieldState.error?.message}
              required
              className="span-2"
            >
              <Dropdown
                inputId="room-location"
                value={field.value || null}
                options={locations?.items ?? []}
                optionLabel="name"
                optionValue="id"
                placeholder="Choose a location"
                filter
                onChange={(e) => field.onChange(e.value ?? '')}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="Name" htmlFor="room-name" error={fieldState.error?.message} required>
              <InputText id="room-name" {...field} invalid={fieldState.invalid} />
            </FormField>
          )}
        />
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <FormField label="Type" htmlFor="room-type">
              <Dropdown
                inputId="room-type"
                value={field.value}
                options={enumOptions(ROOM_TYPES)}
                onChange={(e) => field.onChange(e.value)}
              />
            </FormField>
          )}
        />
        <Controller
          name="capacity"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="Capacity" htmlFor="room-capacity" error={fieldState.error?.message}>
              <InputNumber
                inputId="room-capacity"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value ?? 0)}
                onBlur={field.onBlur}
                min={1}
                max={200}
                showButtons
                suffix=" seats"
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="hourlyRate"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="Hourly rate" htmlFor="room-rate" error={fieldState.error?.message}>
              <InputNumber
                inputId="room-rate"
                value={field.value}
                onValueChange={(e) => field.onChange(e.value ?? 0)}
                onBlur={field.onBlur}
                mode="currency"
                currency="EUR"
                locale="en-GB"
                min={0}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="amenities"
          control={control}
          render={({ field }) => (
            <FormField label="Amenities" htmlFor="room-amenities" className="span-2">
              <MultiSelect
                inputId="room-amenities"
                value={field.value}
                options={enumOptions(AMENITIES)}
                onChange={(e) => field.onChange(e.value)}
                display="chip"
                placeholder="None"
              />
            </FormField>
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <FormField label="Status" htmlFor="room-status">
              <Dropdown
                inputId="room-status"
                value={field.value}
                options={enumOptions(ROOM_STATUSES)}
                onChange={(e) => field.onChange(e.value)}
              />
            </FormField>
          )}
        />
      </form>
    </FormDialog>
  );
};
