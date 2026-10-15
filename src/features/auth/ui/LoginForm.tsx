import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { useLoginMutation } from '@/entities/session';
import { type LoginRequest, errorMessage, loginRequestSchema } from '@/shared/api';
import { FormField } from '@/shared/ui';

import styles from './LoginForm.module.scss';

interface Props {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: Props) => {
  const [login] = useLoginMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values).unwrap();
      onSuccess();
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {serverError ? (
        <Message severity="error" text={serverError} className={styles.alert} />
      ) : null}

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <FormField label="Email" htmlFor="login-email" error={fieldState.error?.message}>
            <InputText
              id="login-email"
              type="email"
              autoComplete="username"
              autoFocus
              {...field}
              invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? 'login-email-error' : undefined}
            />
          </FormField>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <FormField label="Password" htmlFor="login-password" error={fieldState.error?.message}>
            <Password
              inputId="login-password"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              inputRef={field.ref}
              feedback={false}
              toggleMask
              autoComplete="current-password"
              invalid={fieldState.invalid}
            />
          </FormField>
        )}
      />

      <Button type="submit" label="Sign in" icon="pi pi-sign-in" loading={isSubmitting} />
    </form>
  );
};
