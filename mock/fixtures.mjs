/**
 * Seed data for the zero-dependency mock. Deterministic: the same seed and day give the same data.
 * No faker here on purpose — this mock runs on a bare Node.js install.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Small seeded PRNG (mulberry32). */
export const createRandom = (seed) => {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min, max) => min + Math.floor(next() * (max - min + 1));
  const pick = (list) => list[int(0, list.length - 1)];
  const chance = (p) => next() < p;
  const shuffle = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  return { next, int, pick, chance, shuffle };
};

export const DEMO_USERS = [
  { id: 'usr_admin', name: 'Alex Morgan', email: 'admin@coworking.test', role: 'admin' },
  { id: 'usr_manager', name: 'Sam Rivera', email: 'manager@coworking.test', role: 'manager' },
];
export const DEMO_PASSWORD = 'demo1234';

const LOCATIONS = [
  ['Riverside Hub', 'Kyiv', '12 Naberezhna St', 'Europe/Kyiv', '08:00', '21:00', 'active'],
  ['Market Square Loft', 'Lviv', '3 Rynok Sq', 'Europe/Kyiv', '08:00', '20:00', 'active'],
  ['Old Mill Works', 'Kraków', '41 Józefa St', 'Europe/Warsaw', '07:30', '20:00', 'active'],
  ['Canal Yard', 'Berlin', '8 Ufer Str.', 'Europe/Berlin', '08:00', '22:00', 'active'],
  ['Harbour Studio', 'Lisbon', '27 Rua do Cais', 'Europe/Lisbon', '09:00', '19:00', 'inactive'],
];

const ROOM_NAMES = [
  'Aurora',
  'Birch',
  'Cedar',
  'Delta',
  'Ember',
  'Fjord',
  'Granite',
  'Harbor',
  'Iris',
];
const ROOM_PROFILES = {
  meeting_room: { capacity: [4, 12], rate: [1500, 4000] },
  private_office: { capacity: [2, 8], rate: [2000, 5000] },
  hot_desk: { capacity: [10, 40], rate: [500, 1200] },
  event_space: { capacity: [30, 120], rate: [8000, 20000] },
};
const AMENITIES = [
  'projector',
  'whiteboard',
  'video_conferencing',
  'phone',
  'standing_desks',
  'natural_light',
];

const FIRST_NAMES = [
  'Olena',
  'Taras',
  'Maria',
  'Andrii',
  'Iryna',
  'Dmytro',
  'Sofia',
  'Yurii',
  'Kateryna',
  'Bohdan',
  'Anna',
  'Piotr',
  'Zofia',
  'Jakub',
  'Lena',
  'Felix',
  'Ines',
  'Tiago',
  'Emma',
  'Lucas',
];
const LAST_NAMES = [
  'Bondarenko',
  'Kovalenko',
  'Shevchenko',
  'Melnyk',
  'Tkachenko',
  'Kowalski',
  'Nowak',
  'Wiśniewska',
  'Schmidt',
  'Becker',
  'Hoffmann',
  'Silva',
  'Santos',
  'Ferreira',
  'Moreau',
];
const COMPANIES = [
  'Northwind Labs',
  'Blue Harbor Studio',
  'Pixel Forge',
  'Greenleaf Analytics',
  'Orbit Media',
  'Brightline Consulting',
  'Quiet Fox Games',
  'Tidewater Legal',
];

const startOfUtcDay = (ms) => ms - (ms % DAY);
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').toLowerCase();

/** @param {{ seed?: number, now?: number }} [options] */
export const createFixtures = ({ seed = 7, now = Date.now() } = {}) => {
  const random = createRandom(seed);
  let sequence = 0;
  const nextId = (prefix) => `${prefix}_${(++sequence).toString(36)}`;

  const locations = LOCATIONS.map(([name, city, address, timezone, opensAt, closesAt, status]) => ({
    id: nextId('loc'),
    name,
    city,
    address,
    timezone,
    opensAt,
    closesAt,
    status,
  }));

  const rooms = [];
  for (const location of locations) {
    const names = random.shuffle(ROOM_NAMES).slice(0, random.int(4, 6));
    names.forEach((name, i) => {
      const type =
        i === 0 ? 'hot_desk' : random.pick(['meeting_room', 'private_office', 'event_space']);
      const { capacity, rate } = ROOM_PROFILES[type];
      rooms.push({
        id: nextId('room'),
        locationId: location.id,
        name,
        type,
        capacity: random.int(capacity[0], capacity[1]),
        hourlyRate: random.int(rate[0] / 50, rate[1] / 50) * 50,
        amenities: random.shuffle(AMENITIES).slice(0, random.int(1, 4)),
        status: random.chance(0.85) ? 'available' : random.pick(['maintenance', 'retired']),
      });
    });
  }

  const members = Array.from({ length: 60 }, () => {
    const firstName = random.pick(FIRST_NAMES);
    const lastName = random.pick(LAST_NAMES);
    const id = nextId('mem');
    return {
      id,
      firstName,
      lastName,
      email: `${slug(firstName)}.${slug(lastName)}.${id.slice(4)}@example.com`,
      phone: `+380 ${random.int(10, 99)} ${random.int(100, 999)} ${random.int(10, 99)} ${random.int(10, 99)}`,
      company: random.chance(0.6) ? random.pick(COMPANIES) : null,
      plan: random.pick(['day_pass', 'flex', 'dedicated', 'team']),
      status: random.chance(0.85) ? 'active' : random.pick(['suspended', 'cancelled']),
      joinedAt: new Date(now - random.int(10, 700) * DAY).toISOString().slice(0, 10),
    };
  });

  const activeMembers = members.filter((m) => m.status === 'active');
  const bookable = rooms.filter(
    (r) =>
      r.status === 'available' && locations.find((l) => l.id === r.locationId)?.status === 'active',
  );
  const today = startOfUtcDay(now);
  const bookings = [];
  for (let day = -14; day <= 14; day += 1) {
    const dayStart = today + day * DAY;
    for (const room of bookable) {
      // 07:00–18:00 UTC fits the opening hours of every seeded location.
      let cursor = dayStart + (7 + random.int(0, 3)) * HOUR;
      const count = random.int(0, 2);
      for (let n = 0; n < count && cursor < dayStart + 16 * HOUR; n += 1) {
        const start = cursor;
        const end = Math.min(start + random.pick([1, 1.5, 2, 3]) * HOUR, dayStart + 18 * HOUR);
        cursor = end + random.pick([0, 1, 2]) * HOUR;
        bookings.push({
          id: nextId('bk'),
          roomId: room.id,
          memberId: random.pick(activeMembers).id,
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
          attendees: random.int(1, Math.min(room.capacity, 8)),
          status: seededStatus(random, start, end, now),
          notes: null,
          totalPrice: Math.round((room.hourlyRate * (end - start)) / HOUR),
          createdAt: new Date(start - random.int(1, 10) * DAY).toISOString(),
        });
      }
    }
  }

  return { locations, rooms, members, bookings, nextId };
};

const seededStatus = (random, start, end, now) => {
  if (end <= now) return random.chance(0.85) ? 'completed' : random.pick(['cancelled', 'no_show']);
  if (start <= now) return 'checked_in';
  return random.chance(0.7) ? 'confirmed' : random.pick(['pending', 'pending', 'cancelled']);
};
