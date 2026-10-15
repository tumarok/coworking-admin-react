export const ROUTES = {
  dashboard: '/',
  login: '/login',
  locations: '/locations',
  location: (id: string) => `/locations/${id}`,
  rooms: '/rooms',
  room: (id: string) => `/rooms/${id}`,
  members: '/members',
  member: (id: string) => `/members/${id}`,
  bookings: '/bookings',
  booking: (id: string) => `/bookings/${id}`,
} as const;
