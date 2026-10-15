import { zodResolver } from '@hookform/resolvers/zod';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { type ComponentProps, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useCreateMemberMutation, useUpdateMemberMutation } from '@/entities/member';
import { MEMBER_PLANS, MEMBER_STATUSES, type Member, memberFullName } from '@/shared/api';
import { applyServerErrors, enumOptions, notify } from '@/shared/lib';
import { FormDialog, FormField } from '@/shared/ui';

import {
  type MemberFormValues,
  memberFormSchema,
  toMemberFormValues,
  toMemberInput,
} from '../model/member-form';

const FIELDS = ['firstName', 'lastName', 'email', 'phone', 'company', 'plan', 'status'];
const FORM_ID = 'member-form';

type TextField = 'firstName' | 'lastName' | 'email' | 'phone' | 'company';

interface Props {
  member?: Member | null;
  visible: boolean;
  onHide: () => void;
  onSaved?: (member: Member) => void;
}

export const MemberFormDialog = ({ member, visible, onHide, onSaved }: Props) => {
  const [create] = useCreateMemberMutation();
  const [update] = useUpdateMemberMutation();
  const [banner, setBanner] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: toMemberFormValues(member),
    mode: 'onTouched',
  });

  // Reset when the dialog opens or switches member, never on a background refetch.
  useEffect(() => {
    if (!visible) return;
    reset(toMemberFormValues(member));
    setBanner(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, member?.id, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setBanner(null);
    try {
      const body = toMemberInput(values);
      const saved = member
        ? await update({ id: member.id, body }).unwrap()
        : await create(body).unwrap();
      notify.success(member ? 'Member updated' : 'Member added', memberFullName(saved));
      onSaved?.(saved);
      onHide();
    } catch (error) {
      setBanner(applyServerErrors(error, setError, FIELDS));
    }
  });

  const text = (
    name: TextField,
    label: string,
    props: ComponentProps<typeof InputText> = {},
    required = true,
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormField
          label={label}
          htmlFor={`member-${name}`}
          error={fieldState.error?.message}
          required={required}
        >
          <InputText id={`member-${name}`} {...props} {...field} invalid={fieldState.invalid} />
        </FormField>
      )}
    />
  );

  return (
    <FormDialog
      header={member ? `Edit ${memberFullName(member)}` : 'New member'}
      visible={visible}
      onHide={onHide}
      formId={FORM_ID}
      submitting={isSubmitting}
      banner={banner}
    >
      <form id={FORM_ID} className="form-grid" onSubmit={onSubmit} noValidate>
        {text('firstName', 'First name', { autoComplete: 'off' })}
        {text('lastName', 'Last name', { autoComplete: 'off' })}
        {text('email', 'Email', { type: 'email', autoComplete: 'off' })}
        {text('phone', 'Phone', { type: 'tel', placeholder: '+380 44 123 45 67' })}
        {text('company', 'Company', {}, false)}
        <Controller
          name="plan"
          control={control}
          render={({ field }) => (
            <FormField label="Plan" htmlFor="member-plan">
              <Dropdown
                inputId="member-plan"
                value={field.value}
                options={enumOptions(MEMBER_PLANS)}
                onChange={(e) => field.onChange(e.value)}
              />
            </FormField>
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <FormField label="Status" htmlFor="member-status">
              <Dropdown
                inputId="member-status"
                value={field.value}
                options={enumOptions(MEMBER_STATUSES)}
                onChange={(e) => field.onChange(e.value)}
              />
            </FormField>
          )}
        />
      </form>
    </FormDialog>
  );
};
