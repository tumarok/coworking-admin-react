import { ProgressBar } from 'primereact/progressbar';
import { Outlet, useNavigation } from 'react-router';

import { AppSidebar } from '@/widgets/app-sidebar';

import styles from './AppLayout.module.scss';

export const AppLayout = () => {
  const navigation = useNavigation();

  return (
    <div className={styles.shell}>
      <AppSidebar />
      <main className={styles.main}>
        {navigation.state === 'loading' ? (
          <ProgressBar mode="indeterminate" className={styles.progress} />
        ) : null}
        <Outlet />
      </main>
    </div>
  );
};
