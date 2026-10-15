import type { ReactNode } from 'react';

interface Props {
  icon?: string;
  title: string;
  children?: ReactNode;
}

export const EmptyState = ({ icon = 'pi pi-inbox', title, children }: Props) => (
  <section
    className="card"
    style={{ display: 'grid', justifyItems: 'center', gap: '0.5rem', padding: '3rem 1rem' }}
  >
    <i
      className={icon}
      style={{ fontSize: '2rem', color: 'var(--text-muted)' }}
      aria-hidden="true"
    />
    <h2 style={{ margin: 0 }}>{title}</h2>
    {children}
  </section>
);
