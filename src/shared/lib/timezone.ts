/**
 * Bookings are entered in the location's local time and stored as UTC instants. The browser's own
 * time zone plays no part: a manager in Kyiv books a room in Lisbon in Lisbon time.
 */

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const wallClock = (ms: number, timeZone: string): WallClock => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
};

/** How far the zone's wall clock is ahead of UTC at a given instant, in ms. */
const zoneOffset = (ms: number, timeZone: string) => {
  const w = wallClock(ms, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  return asUtc - (ms - (ms % 60_000));
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-07-01" + "09:00" in Europe/Kyiv -> "2026-07-01T06:00:00.000Z". */
export const zonedToUtcIso = (date: string, time: string, timeZone: string): string => {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute);
  // The offset depends on the instant itself, so correct once more around DST switches.
  const first = asIfUtc - zoneOffset(asIfUtc, timeZone);
  const second = asIfUtc - zoneOffset(first, timeZone);
  return new Date(second).toISOString();
};

/** The inverse: an instant as local date and time in the zone. */
export const utcToZoned = (iso: string, timeZone: string): { date: string; time: string } => {
  const w = wallClock(Date.parse(iso), timeZone);
  return {
    date: `${w.year}-${pad(w.month)}-${pad(w.day)}`,
    time: `${pad(w.hour)}:${pad(w.minute)}`,
  };
};

/** Today's date in a zone, "YYYY-MM-DD". */
export const todayIn = (timeZone: string, now = Date.now()) =>
  utcToZoned(new Date(now).toISOString(), timeZone).date;
