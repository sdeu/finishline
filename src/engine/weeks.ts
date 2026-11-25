import { differenceInCalendarDays, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { CONFIG } from './config';
import type { ISODate, WeekKey } from './types';

/** ISO week key (Monday start) in the game time zone, e.g. '2026-W48'. */
export function weekKey(now: Date): WeekKey {
  return formatInTimeZone(now, CONFIG.timezone, "RRRR-'W'II");
}

/** True when both instants fall on the same calendar day in the game time zone. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return localDate(a) === localDate(b);
}

/** Last millisecond of a calendar date ('2026-12-31') in the game time zone, as ISO. */
export function endOfLocalDay(date: string): ISODate {
  return fromZonedTime(`${date}T23:59:59.999`, CONFIG.timezone).toISOString();
}

/** Calendar date ('2026-12-31') of an instant in the game time zone. */
export function localDate(at: ISODate | Date): string {
  return formatInTimeZone(at, CONFIG.timezone, 'yyyy-MM-dd');
}

/** Calendar days from today to the deadline's day, in the game time zone. Negative when overdue. */
export function daysUntil(deadline: ISODate, now: Date): number {
  return differenceInCalendarDays(parseISO(localDate(deadline)), parseISO(localDate(now)));
}
