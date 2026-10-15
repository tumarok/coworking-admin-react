import { PrimeReactProvider } from 'primereact/api';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router/dom';

import { ToastHost } from './notifications/ToastHost';
import { createAppRouter } from './router';
import { createStore } from './model/store';

const store = createStore();
const router = createAppRouter();

export const App = () => (
  <Provider store={store}>
    <PrimeReactProvider value={{ ripple: true }}>
      <ToastHost />
      <RouterProvider router={router} />
    </PrimeReactProvider>
  </Provider>
);
