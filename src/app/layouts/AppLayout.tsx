import { ProgressBar } from 'primereact/progressbar';
import { Outlet, useNavigation } from 'react-router';

import { AppSidebar } from '@/widgets/app-sidebar';
import { UserMenu } from '@/features/auth';

import styles from './AppLayout.module.scss';

export const AppLayout = () => {
  const navigation = useNavigation();

  return (
    <div className={styles.shell}>
      <AppSidebar footer={<UserMenu />} />
      <main className={styles.main}>
        {navigation.state === 'loading' ? (
          <ProgressBar mode="indeterminate" className={styles.progress} />
        ) : null}
        <Outlet />
      </main>
    </div>
  );
};
