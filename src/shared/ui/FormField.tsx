import type { ReactNode } from 'react';

import styles from './FormField.module.scss';

interface Props {
  label: string;
  /** id of the control, so the label is clickable and announced. */
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label, control and the field's error message, wired for screen readers. */
export const FormField = ({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: Props) => (
  <div className={className ? `${styles.field} ${className}` : styles.field}>
    <label htmlFor={htmlFor} className={styles.label}>
      {label}
      {required ? (
        <span className={styles.required} aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
    {children}
    {error ? (
      <small id={`${htmlFor}-error`} className={styles.error} role="alert">
        {error}
      </small>
    ) : hint ? (
      <small className={styles.hint}>{hint}</small>
    ) : null}
  </div>
);
