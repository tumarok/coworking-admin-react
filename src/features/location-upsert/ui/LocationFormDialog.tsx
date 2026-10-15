import { zodResolver } from '@hookform/resolvers/zod';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useCreateLocationMutation, useUpdateLocationMutation } from '@/entities/location';
import {
  LOCATION_STATUSES,
  type Location,
  type LocationInput,
  TIMEZONES,
  locationInputSchema,
} from '@/shared/api';
import { applyServerErrors, enumOptions, notify } from '@/shared/lib';
import { FormDialog, FormField } from '@/shared/ui';

const FIELDS = ['name', 'city', 'address', 'timezone', 'opensAt', 'closesAt', 'status'] as const;
const FORM_ID = 'location-form';

const toValues = (location?: Location | null): LocationInput =>
  location
    ? {
        name: location.name,
        city: location.city,
        address: location.address,
        timezone: location.timezone,
        opensAt: location.opensAt,
        closesAt: location.closesAt,
        status: location.status,
      }
    : {
        name: '',
        city: '',
        address: '',
        timezone: 'Europe/Kyiv',
        opensAt: '08:00',
        closesAt: '20:00',
        status: 'active',
      };

interface Props {
  /** Edit this location; create a new one when absent. */
  location?: Location | null;
  visible: boolean;
  onHide: () => void;
  onSaved?: (location: Location) => void;
}

export const LocationFormDialog = ({ location, visible, onHide, onSaved }: Props) => {
  const [create] = useCreateLocationMutation();
  const [update] = useUpdateLocationMutation();
  const [banner, setBanner] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<LocationInput>({
    resolver: zodResolver(locationInputSchema),
    defaultValues: toValues(location),
    mode: 'onTouched',
  });

  // Reset only when the dialog opens or switches to another location: a background refetch of
  // the same location must not wipe what the user is typing.
  useEffect(() => {
    if (!visible) return;
    reset(toValues(location));
    setBanner(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, location?.id, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    try {
      const saved = location
        ? await update({ id: location.id, body: values }).unwrap()
        : await create(values).unwrap();
      notify.success(location ? 'Location updated' : 'Location created', saved.name);
      onSaved?.(saved);
      onHide();
    } catch (error) {
      setBanner(applyServerErrors(error, setError, FIELDS));
    }
  });

  return (
    <FormDialog
      header={location ? `Edit ${location.name}` : 'New location'}
      visible={visible}
      onHide={onHide}
      formId={FORM_ID}
      submitting={isSubmitting}
      banner={banner}
    >
      <form id={FORM_ID} className="form-grid" onSubmit={onSubmit} noValidate>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Name"
              htmlFor="location-name"
              error={fieldState.error?.message}
              required
            >
              <InputText id="location-name" {...field} invalid={fieldState.invalid} />
            </FormField>
          )}
        />
        <Controller
          name="city"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="City"
              htmlFor="location-city"
              error={fieldState.error?.message}
              required
            >
              <InputText id="location-city" {...field} invalid={fieldState.invalid} />
            </FormField>
          )}
        />
        <Controller
          name="address"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Address"
              htmlFor="location-address"
              error={fieldState.error?.message}
              required
              className="span-2"
            >
              <InputText id="location-address" {...field} invalid={fieldState.invalid} />
            </FormField>
          )}
        />
        <Controller
          name="timezone"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Time zone"
              htmlFor="location-timezone"
              error={fieldState.error?.message}
            >
              <Dropdown
                inputId="location-timezone"
                value={field.value}
                options={[...TIMEZONES]}
                onChange={(e) => field.onChange(e.value)}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="Status" htmlFor="location-status" error={fieldState.error?.message}>
              <Dropdown
                inputId="location-status"
                value={field.value}
                options={enumOptions(LOCATION_STATUSES)}
                onChange={(e) => field.onChange(e.value)}
                onBlur={field.onBlur}
              />
            </FormField>
          )}
        />
        <Controller
          name="opensAt"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="Opens at" htmlFor="location-opens" error={fieldState.error?.message}>
              <InputText
                id="location-opens"
                type="time"
                step={900}
                {...field}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
        <Controller
          name="closesAt"
          control={control}
          render={({ field, fieldState }) => (
            <FormField
              label="Closes at"
              htmlFor="location-closes"
              error={fieldState.error?.message}
            >
              <InputText
                id="location-closes"
                type="time"
                step={900}
                {...field}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />
      </form>
    </FormDialog>
  );
};
