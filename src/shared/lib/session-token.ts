const KEY = 'coworking-admin.token';

/** The bearer token lives in sessionStorage: it survives reloads but not closing the tab. */
export const sessionToken = {
  get: (): string | null => sessionStorage.getItem(KEY),
  set: (token: string) => sessionStorage.setItem(KEY, token),
  clear: () => sessionStorage.removeItem(KEY),
};
