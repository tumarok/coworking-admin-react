import { Button } from 'primereact/button';
import { useNavigate } from 'react-router';

import { logout, selectCurrentUser } from '@/entities/session';
import { ROUTES } from '@/shared/config';
import { useAppDispatch, useAppSelector } from '@/shared/lib';

import styles from './UserMenu.module.scss';

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const UserMenu = () => {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const signOut = () => {
    dispatch(logout());
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <div className={styles.menu}>
      <span className={styles.avatar} aria-hidden="true">
        {user ? initials(user.name) : '…'}
      </span>
      <div className={styles.who}>
        <span className={styles.name}>{user?.name ?? 'Signed in'}</span>
        <span className={styles.role}>{user?.role}</span>
      </div>
      <Button
        icon="pi pi-sign-out"
        rounded
        text
        aria-label="Sign out"
        className={styles.signOut}
        onClick={signOut}
      />
    </div>
  );
};
