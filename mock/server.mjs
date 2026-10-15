/**
 * Zero-dependency mock of the Coworking Admin API: one file, plain Node.js, data in memory.
 *
 *   node mock/server.mjs                 # http://localhost:4010/api/v1
 *   PORT=5000 MOCK_LATENCY_MS=300 node mock/server.mjs
 *
 * It implements the same contract as the TypeScript mock in server/ (paging, filters, validation,
 * booking rules); the parity tests in server/parity.test.ts run one scenario suite against both.
 */
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

import { DEMO_PASSWORD, DEMO_USERS, createFixtures } from './fixtures.mjs';

const PREFIX = '/api/v1';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const TOKEN_PREFIX = 'demo-token.';

const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'no_show',
];
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};
const OCCUPYING = ['pending', 'confirmed', 'checked_in'];

// --- errors and validation ----------------------------------------------------------------------
class HttpError extends Error {
  constructor(status, body) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}
const notFound = (what) => new HttpError(404, { message: `${what} not found` });
const conflict = (message, extra = {}) => new HttpError(409, { message, ...extra });
const invalid = (fieldErrors) => new HttpError(422, { message: 'Validation failed', fieldErrors });

const text = (min, max) => (v) =>
  typeof v !== 'string' || v.trim().length < min
    ? min > 1
      ? `At least ${min} characters`
      : 'Required'
    : v.trim().length > max
      ? `At most ${max} characters`
      : null;
const oneOf = (values) => (v) => (values.includes(v) ? null : `One of: ${values.join(', ')}`);
const time = (v) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(v ?? '') ? null : 'Use the HH:mm format');
const int = (min, max) => (v) =>
  Number.isInteger(v) && v >= min && v <= max ? null : `A whole number from ${min} to ${max}`;
const email = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? '') ? null : 'Enter a valid email');
const phone = (v) => (/^\+?[0-9 ()-]{7,20}$/.test(v ?? '') ? null : 'Enter a valid phone number');
const instant = (v) =>
  typeof v === 'string' && v.endsWith('Z') && !Number.isNaN(Date.parse(v))
    ? null
    : 'Use an ISO date-time in UTC';
const id = (v) => (typeof v === 'string' && v.length > 0 ? null : 'Required');
const optional = (rule) => (v) => (v === null || v === undefined || v === '' ? null : rule(v));

const validate = (body, rules) => {
  const fieldErrors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const message = rule(body?.[field], body ?? {});
    if (message) fieldErrors[field] = message;
  }
  if (Object.keys(fieldErrors).length > 0) throw invalid(fieldErrors);
  return Object.fromEntries(Object.keys(rules).map((k) => [k, body[k]]));
};

const LOCATION_RULES = {
  name: text(2, 80),
  city: text(2, 60),
  address: text(5, 160),
  timezone: oneOf([
    'Europe/Kyiv',
    'Europe/Warsaw',
    'Europe/Berlin',
    'Europe/Lisbon',
    'Europe/London',
  ]),
  opensAt: time,
  closesAt: (v, all) =>
    time(v) ?? (v > all.opensAt ? null : 'Closing time must be after opening time'),
  status: oneOf(['active', 'inactive']),
};
const ROOM_RULES = {
  locationId: id,
  name: text(2, 60),
  type: oneOf(['meeting_room', 'private_office', 'hot_desk', 'event_space']),
  capacity: int(1, 200),
  hourlyRate: int(0, 1_000_000),
  amenities: (v) => (Array.isArray(v) ? null : 'Must be a list'),
  status: oneOf(['available', 'maintenance', 'retired']),
};
const MEMBER_RULES = {
  firstName: text(1, 60),
  lastName: text(1, 60),
  email,
  phone,
  company: optional(text(1, 80)),
  plan: oneOf(['day_pass', 'flex', 'dedicated', 'team']),
  status: oneOf(['active', 'suspended', 'cancelled']),
};
const BOOKING_RULES = {
  roomId: id,
  memberId: id,
  startsAt: instant,
  endsAt: (v, all) => {
    const bad = instant(v);
    if (bad) return bad;
    const hours = (Date.parse(v) - Date.parse(all.startsAt)) / HOUR;
    if (!(hours > 0)) return 'End must be after start';
    return hours > 8 ? 'A booking cannot be longer than 8 hours' : null;
  },
  attendees: int(1, 10_000),
  notes: optional(text(1, 500)),
};

// --- helpers -----------------------------------------------------------------------------------
const paginate = (items, query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit };
};
const matches = (q, ...fields) =>
  !q || fields.some((f) => f?.toLowerCase().includes(String(q).toLowerCase()));
const fullName = (m) => `${m.firstName} ${m.lastName}`;
const localTime = (iso, timeZone) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
const localDate = (iso, timeZone) =>
  new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(iso));
const overlaps = (a1, a2, b1, b2) =>
  Date.parse(a1) < Date.parse(b2) && Date.parse(b1) < Date.parse(a2);

// --- the API -----------------------------------------------------------------------------------
/** @param {{ seed?: number, now?: number }} [options] */
export const createMockApi = ({ seed, now } = {}) => {
  const clock = () => now ?? Date.now();
  let db = createFixtures({ seed, now: clock() });

  const roomView = (r) => ({
    ...r,
    locationName: db.locations.find((l) => l.id === r.locationId)?.name ?? '—',
  });
  const locationView = (l) => ({
    ...l,
    roomCount: db.rooms.filter((r) => r.locationId === l.id).length,
  });
  const bookingView = (b) => {
    const room = db.rooms.find((r) => r.id === b.roomId);
    const location = db.locations.find((l) => l.id === room?.locationId);
    const member = db.members.find((m) => m.id === b.memberId);
    return {
      ...b,
      roomName: room?.name ?? '—',
      locationId: location?.id ?? '',
      locationName: location?.name ?? '—',
      memberName: member ? fullName(member) : '—',
    };
  };
  const find = (list, itemId, what) => {
    const item = list.find((i) => i.id === itemId);
    if (!item) throw notFound(what);
    return item;
  };
  const hasUpcoming = (bookings) =>
    bookings.some((b) => OCCUPYING.includes(b.status) && Date.parse(b.endsAt) > clock());

  const assertBookable = (input, excludeId) => {
    const room = db.rooms.find((r) => r.id === input.roomId);
    if (!room) throw invalid({ roomId: 'Room not found' });
    const location = db.locations.find((l) => l.id === room.locationId);
    const fieldErrors = {};
    if (room.status !== 'available') fieldErrors.roomId = 'This room is not available for booking';
    else if (location.status !== 'active') fieldErrors.roomId = 'This location is closed';
    const member = db.members.find((m) => m.id === input.memberId);
    if (!member) fieldErrors.memberId = 'Member not found';
    else if (member.status !== 'active') fieldErrors.memberId = `Member is ${member.status}`;
    if (input.attendees > room.capacity)
      fieldErrors.attendees = `This room seats up to ${room.capacity}`;
    const tz = location.timezone;
    const inHours =
      localDate(input.startsAt, tz) === localDate(input.endsAt, tz) &&
      localTime(input.startsAt, tz) >= location.opensAt &&
      localTime(input.endsAt, tz) <= location.closesAt;
    if (!inHours) {
      fieldErrors.startsAt = `Outside opening hours (${location.opensAt}–${location.closesAt} local time)`;
    }
    if (Object.keys(fieldErrors).length > 0) throw invalid(fieldErrors);
    const conflicts = db.bookings
      .filter(
        (b) =>
          b.roomId === room.id &&
          b.id !== excludeId &&
          OCCUPYING.includes(b.status) &&
          overlaps(input.startsAt, input.endsAt, b.startsAt, b.endsAt),
      )
      .map(({ id: bookingId, startsAt, endsAt }) => ({ id: bookingId, startsAt, endsAt }));
    if (conflicts.length > 0)
      throw conflict('The room is already booked for this time', { conflicts });
    return room;
  };
  const price = (room, startsAt, endsAt) =>
    Math.round((room.hourlyRate * (Date.parse(endsAt) - Date.parse(startsAt))) / HOUR);

  /** [method, path pattern, handler({ params, query, body }), { auth }] */
  const routes = [
    [
      'POST',
      /^\/auth\/login$/,
      ({ body }) => {
        validate(body, { email, password: text(1, 200) });
        const user = DEMO_USERS.find((u) => u.email === String(body.email).toLowerCase());
        if (!user || body.password !== DEMO_PASSWORD) {
          throw new HttpError(401, { message: 'Invalid email or password' });
        }
        return [200, { token: `${TOKEN_PREFIX}${user.id}`, user }];
      },
      { auth: false },
    ],
    ['GET', /^\/auth\/me$/, ({ user }) => [200, user]],
    [
      'POST',
      /^\/__reset$/,
      () => {
        db = createFixtures({ seed, now: clock() });
        return [204];
      },
      { auth: false },
    ],

    [
      'GET',
      /^\/dashboard$/,
      ({ query }) => {
        const date = query.date ?? new Date(clock()).toISOString().slice(0, 10);
        const dayStart = Date.parse(`${date}T00:00:00.000Z`);
        const onDay = db.bookings.filter((b) => {
          const t = Date.parse(b.startsAt);
          return t >= dayStart && t < dayStart + DAY;
        });
        const live = onDay.filter((b) => OCCUPYING.includes(b.status) || b.status === 'completed');
        const occupancy = db.locations
          .filter((l) => l.status === 'active')
          .map((l) => {
            const rooms = db.rooms.filter((r) => r.locationId === l.id && r.status === 'available');
            const ids = new Set(rooms.map((r) => r.id));
            const toHours = (hhmm) => Number(hhmm.slice(0, 2)) + Number(hhmm.slice(3)) / 60;
            const booked = live
              .filter((b) => ids.has(b.roomId))
              .reduce((s, b) => s + (Date.parse(b.endsAt) - Date.parse(b.startsAt)) / HOUR, 0);
            return {
              locationId: l.id,
              locationName: l.name,
              bookedHours: Math.round(booked * 2) / 2,
              availableHours: rooms.length * (toHours(l.closesAt) - toHours(l.opensAt)),
            };
          });
        const available = occupancy.reduce((s, o) => s + o.availableHours, 0);
        const booked = occupancy.reduce((s, o) => s + o.bookedHours, 0);
        const byStatus = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0]));
        for (const b of onDay) byStatus[b.status] += 1;
        const month = date.slice(0, 7);
        return [
          200,
          {
            date,
            kpis: {
              bookingsToday: onDay.filter((b) => b.status !== 'cancelled').length,
              occupancyRate: available > 0 ? Math.min(1, booked / available) : 0,
              revenueMonth: db.bookings
                .filter(
                  (b) =>
                    b.startsAt.startsWith(month) &&
                    ['confirmed', 'checked_in', 'completed'].includes(b.status),
                )
                .reduce((s, b) => s + b.totalPrice, 0),
              activeMembers: db.members.filter((m) => m.status === 'active').length,
            },
            occupancy,
            byStatus,
            upcoming: db.bookings
              .filter(
                (b) =>
                  Date.parse(b.startsAt) >= clock() && ['pending', 'confirmed'].includes(b.status),
              )
              .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
              .slice(0, 8)
              .map(bookingView),
          },
        ];
      },
    ],

    // locations
    [
      'GET',
      /^\/locations$/,
      ({ query }) => [
        200,
        paginate(
          db.locations
            .filter((l) => matches(query.q, l.name, l.city, l.address))
            .filter((l) => !query.city || l.city.toLowerCase() === query.city.toLowerCase())
            .filter((l) => !query.status || l.status === query.status)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(locationView),
          query,
        ),
      ],
    ],
    [
      'GET',
      /^\/locations\/([^/]+)$/,
      ({ params }) => [200, locationView(find(db.locations, params[0], 'Location'))],
    ],
    [
      'POST',
      /^\/locations$/,
      ({ body }) => {
        const location = { id: db.nextId('loc'), ...validate(body, LOCATION_RULES) };
        db.locations.push(location);
        return [201, locationView(location)];
      },
    ],
    [
      'PATCH',
      /^\/locations\/([^/]+)$/,
      ({ params, body }) => {
        const location = find(db.locations, params[0], 'Location');
        Object.assign(location, validate(body, LOCATION_RULES));
        return [200, locationView(location)];
      },
    ],
    [
      'DELETE',
      /^\/locations\/([^/]+)$/,
      ({ params }) => {
        const location = find(db.locations, params[0], 'Location');
        if (db.rooms.some((r) => r.locationId === location.id)) {
          throw conflict('Remove or move the rooms of this location first');
        }
        db.locations = db.locations.filter((l) => l.id !== location.id);
        return [204];
      },
    ],

    // rooms
    [
      'GET',
      /^\/rooms$/,
      ({ query }) => [
        200,
        paginate(
          db.rooms
            .map(roomView)
            .filter((r) => matches(query.q, r.name, r.locationName))
            .filter((r) => !query.locationId || r.locationId === query.locationId)
            .filter((r) => !query.type || r.type === query.type)
            .filter((r) => !query.status || r.status === query.status)
            .filter((r) => !query.minCapacity || r.capacity >= Number(query.minCapacity))
            .sort(
              (a, b) =>
                a.locationName.localeCompare(b.locationName) || a.name.localeCompare(b.name),
            ),
          query,
        ),
      ],
    ],
    [
      'GET',
      /^\/rooms\/([^/]+)$/,
      ({ params }) => [200, roomView(find(db.rooms, params[0], 'Room'))],
    ],
    [
      'POST',
      /^\/rooms$/,
      ({ body }) => {
        const input = validate(body, ROOM_RULES);
        if (!db.locations.some((l) => l.id === input.locationId))
          throw invalid({ locationId: 'Location not found' });
        const room = { id: db.nextId('room'), ...input };
        db.rooms.push(room);
        return [201, roomView(room)];
      },
    ],
    [
      'PATCH',
      /^\/rooms\/([^/]+)$/,
      ({ params, body }) => {
        const room = find(db.rooms, params[0], 'Room');
        const input = validate(body, ROOM_RULES);
        if (!db.locations.some((l) => l.id === input.locationId))
          throw invalid({ locationId: 'Location not found' });
        Object.assign(room, input);
        return [200, roomView(room)];
      },
    ],
    [
      'DELETE',
      /^\/rooms\/([^/]+)$/,
      ({ params }) => {
        const room = find(db.rooms, params[0], 'Room');
        if (hasUpcoming(db.bookings.filter((b) => b.roomId === room.id))) {
          throw conflict('This room has upcoming bookings; cancel them first');
        }
        db.rooms = db.rooms.filter((r) => r.id !== room.id);
        return [204];
      },
    ],

    // members
    [
      'GET',
      /^\/members$/,
      ({ query }) => [
        200,
        paginate(
          db.members
            .filter((m) => matches(query.q, fullName(m), m.email, m.company))
            .filter((m) => !query.plan || m.plan === query.plan)
            .filter((m) => !query.status || m.status === query.status)
            .sort(
              (a, b) =>
                a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
            ),
          query,
        ),
      ],
    ],
    ['GET', /^\/members\/([^/]+)$/, ({ params }) => [200, find(db.members, params[0], 'Member')]],
    [
      'POST',
      /^\/members$/,
      ({ body }) => {
        const input = validate(body, MEMBER_RULES);
        if (db.members.some((m) => m.email === input.email.toLowerCase())) {
          throw invalid({ email: 'This email is already registered' });
        }
        const member = {
          id: db.nextId('mem'),
          ...input,
          email: input.email.toLowerCase(),
          company: input.company || null,
          joinedAt: new Date(clock()).toISOString().slice(0, 10),
        };
        db.members.push(member);
        return [201, member];
      },
    ],
    [
      'PATCH',
      /^\/members\/([^/]+)$/,
      ({ params, body }) => {
        const member = find(db.members, params[0], 'Member');
        const input = validate(body, MEMBER_RULES);
        if (db.members.some((m) => m.email === input.email.toLowerCase() && m.id !== member.id)) {
          throw invalid({ email: 'This email is already registered' });
        }
        Object.assign(member, input, {
          email: input.email.toLowerCase(),
          company: input.company || null,
        });
        return [200, member];
      },
    ],
    [
      'DELETE',
      /^\/members\/([^/]+)$/,
      ({ params }) => {
        const member = find(db.members, params[0], 'Member');
        if (hasUpcoming(db.bookings.filter((b) => b.memberId === member.id))) {
          throw conflict('This member has upcoming bookings; cancel them first');
        }
        db.members = db.members.filter((m) => m.id !== member.id);
        return [204];
      },
    ],

    // bookings
    [
      'GET',
      /^\/bookings$/,
      ({ query }) => {
        const from = query.from ? Date.parse(`${query.from}T00:00:00.000Z`) : -Infinity;
        const to = query.to ? Date.parse(`${query.to}T00:00:00.000Z`) + DAY : Infinity;
        return [
          200,
          paginate(
            db.bookings
              .map(bookingView)
              .filter((b) => Date.parse(b.startsAt) >= from && Date.parse(b.startsAt) < to)
              .filter((b) => matches(query.q, b.memberName, b.roomName, b.locationName))
              .filter((b) => !query.status || b.status === query.status)
              .filter((b) => !query.locationId || b.locationId === query.locationId)
              .filter((b) => !query.roomId || b.roomId === query.roomId)
              .filter((b) => !query.memberId || b.memberId === query.memberId)
              .sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
            query,
          ),
        ];
      },
    ],
    [
      'POST',
      /^\/bookings\/bulk$/,
      ({ body }) => {
        validate(body, {
          ids: (v) =>
            Array.isArray(v) && v.length > 0 && v.length <= 100 ? null : 'From 1 to 100 ids',
          action: oneOf(['confirm', 'cancel']),
        });
        const target = body.action === 'confirm' ? 'confirmed' : 'cancelled';
        const updated = [];
        const failed = [];
        for (const bookingId of body.ids) {
          const booking = db.bookings.find((b) => b.id === bookingId);
          if (!booking) failed.push({ id: bookingId, reason: 'Booking not found' });
          else if (!TRANSITIONS[booking.status].includes(target)) {
            failed.push({
              id: bookingId,
              reason: `Cannot ${body.action} a booking that is ${booking.status.replace('_', ' ')}`,
            });
          } else {
            booking.status = target;
            updated.push(bookingId);
          }
        }
        return [200, { updated, failed }];
      },
    ],
    [
      'GET',
      /^\/bookings\/([^/]+)$/,
      ({ params }) => [200, bookingView(find(db.bookings, params[0], 'Booking'))],
    ],
    [
      'POST',
      /^\/bookings$/,
      ({ body }) => {
        const input = validate(body, BOOKING_RULES);
        const room = assertBookable(input);
        const booking = {
          id: db.nextId('bk'),
          ...input,
          notes: input.notes || null,
          status: 'pending',
          totalPrice: price(room, input.startsAt, input.endsAt),
          createdAt: new Date(clock()).toISOString(),
        };
        db.bookings.push(booking);
        return [201, bookingView(booking)];
      },
    ],
    [
      'PATCH',
      /^\/bookings\/([^/]+)$/,
      ({ params, body }) => {
        const booking = find(db.bookings, params[0], 'Booking');
        if (!['pending', 'confirmed'].includes(booking.status)) {
          throw conflict('Only pending or confirmed bookings can be edited');
        }
        const input = validate(body, BOOKING_RULES);
        const room = assertBookable(input, booking.id);
        Object.assign(booking, input, {
          notes: input.notes || null,
          totalPrice: price(room, input.startsAt, input.endsAt),
        });
        return [200, bookingView(booking)];
      },
    ],
    [
      'POST',
      /^\/bookings\/([^/]+)\/status$/,
      ({ params, body }) => {
        const booking = find(db.bookings, params[0], 'Booking');
        validate(body, { status: oneOf(BOOKING_STATUSES) });
        if (!TRANSITIONS[booking.status].includes(body.status)) {
          throw conflict(
            `Cannot change status from ${booking.status.replace('_', ' ')} to ${body.status.replace('_', ' ')}`,
          );
        }
        booking.status = body.status;
        return [200, bookingView(booking)];
      },
    ],
  ];

  const handle = ({ method, path, query, body, authorization }) => {
    try {
      for (const [routeMethod, pattern, handler, options = {}] of routes) {
        if (routeMethod !== method) continue;
        const match = pattern.exec(path);
        if (!match) continue;
        const token = (authorization ?? '').replace(/^Bearer\s+/i, '');
        const user = token.startsWith(TOKEN_PREFIX)
          ? DEMO_USERS.find((u) => u.id === token.slice(TOKEN_PREFIX.length))
          : undefined;
        if (options.auth !== false && !user) {
          throw new HttpError(401, { message: 'Authentication required' });
        }
        const [status, payload] = handler({ params: match.slice(1), query, body, user });
        return { status, body: payload };
      }
      throw new HttpError(404, { message: `No route for ${method} ${path}` });
    } catch (error) {
      if (error instanceof HttpError) return { status: error.status, body: error.body };
      console.error(error);
      return { status: 500, body: { message: 'Internal server error' } };
    }
  };

  return {
    handle,
    get db() {
      return db;
    },
  };
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return undefined;
  }
};

/**
 * An http.Server serving the mock; not listening yet.
 * @param {{ seed?: number, now?: number, latencyMs?: number }} [options]
 */
export const createMockServer = ({ seed, now, latencyMs = 0 } = {}) => {
  const api = createMockApi({ seed, now });
  return createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();

    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(PREFIX)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Not found' }));
    }
    const body = await readBody(req);
    if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs));
    const result = api.handle({
      method: req.method ?? 'GET',
      path: url.pathname.slice(PREFIX.length) || '/',
      query: Object.fromEntries([...url.searchParams].filter(([, v]) => v !== '')),
      body,
      authorization: req.headers.authorization,
    });
    if (result.status === 204 || result.body === undefined)
      return res.writeHead(result.status).end();
    res.writeHead(result.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body));
  });
};

// Started directly (not imported by a test): listen.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4010);
  const latencyMs = Number(process.env.MOCK_LATENCY_MS ?? 250);
  createMockServer({ seed: Number(process.env.MOCK_SEED ?? 7), latencyMs }).listen(port, () => {
    console.warn(`Simple mock API on http://localhost:${port}${PREFIX} (latency ${latencyMs} ms)`);
    console.warn(`Sign in with ${DEMO_USERS[0].email} / ${DEMO_PASSWORD}`);
  });
}
