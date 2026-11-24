import { formatInTimeZone } from 'date-fns-tz';
import { CONFIG } from './config';
import type { WeekKey } from './types';

/** ISO week key (Monday start) in the game time zone, e.g. '2026-W48'. */
export function weekKey(now: Date): WeekKey {
  return formatInTimeZone(now, CONFIG.timezone, "RRRR-'W'II");
}

/** True when both instants fall on the same calendar day in the game time zone. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  const day = (d: Date) => formatInTimeZone(d, CONFIG.timezone, 'yyyy-MM-dd');
  return day(a) === day(b);
}
