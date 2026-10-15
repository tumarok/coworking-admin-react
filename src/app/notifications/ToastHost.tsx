import { Toast } from 'primereact/toast';
import { useEffect, useRef } from 'react';

import { notify } from '@/shared/lib';

/** Shows whatever the rest of the app publishes through `notify`. */
export const ToastHost = () => {
  const toast = useRef<Toast>(null);

  useEffect(
    () =>
      notify.subscribe(({ severity, summary, detail }) => {
        toast.current?.show({
          severity,
          summary,
          detail,
          life: severity === 'error' ? 6000 : 3500,
        });
      }),
    [],
  );

  return <Toast ref={toast} position="top-right" />;
};
