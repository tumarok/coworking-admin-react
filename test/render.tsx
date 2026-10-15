import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider, createMemoryRouter } from 'react-router';

import { type AppStore, createStore } from '@/app/model/store';

interface Options {
  /** URL the test starts at. */
  route?: string;
  /** Route pattern the element is mounted on, e.g. "/rooms/:id". */
  path?: string;
  store?: AppStore;
}

export const renderWithProviders = (
  ui: ReactElement,
  { route = '/', path = '*', store = createStore() }: Options = {},
) => {
  const router = createMemoryRouter([{ path, element: ui }], { initialEntries: [route] });
  const user = userEvent.setup();
  const result = render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return { ...result, store, router, user };
};
