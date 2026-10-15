const DEFAULT_LOCALE = 'en-GB';

/** Prices travel as integer cents to avoid floating point drift. */
export const formatMoney = (cents: number, currency = 'EUR', locale = DEFAULT_LOCALE): string =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);

export const formatDate = (iso: string, locale = DEFAULT_LOCALE): string =>
  new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );

export const formatTime = (iso: string, locale = DEFAULT_LOCALE): string =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
    new Date(iso),
  );

export const formatDateTime = (iso: string, locale = DEFAULT_LOCALE): string =>
  `${formatDate(iso, locale)}, ${formatTime(iso, locale)}`;

/** "12 Oct 2026, 09:00–11:30" when both ends fall on the same day. */
export const formatTimeRange = (
  startIso: string,
  endIso: string,
  locale = DEFAULT_LOCALE,
): string => {
  const sameDay = startIso.slice(0, 10) === endIso.slice(0, 10);
  return sameDay
    ? `${formatDate(startIso, locale)}, ${formatTime(startIso, locale)}–${formatTime(endIso, locale)}`
    : `${formatDateTime(startIso, locale)} – ${formatDateTime(endIso, locale)}`;
};

export const durationHours = (startIso: string, endIso: string): number =>
  (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000;

/** Converts snake_case enum values into readable labels: "meeting_room" -> "Meeting room". */
export const humanize = (value: string): string => {
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** Dropdown options for an enum: value as-is, label humanized. */
export const enumOptions = <V extends string>(values: readonly V[]) =>
  values.map((value) => ({ value, label: humanize(value) }));
