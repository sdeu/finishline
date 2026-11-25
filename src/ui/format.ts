import { formatInTimeZone } from 'date-fns-tz';
import { CONFIG } from '../engine/config';
import { daysUntil } from '../engine/weeks';
import type { ISODate } from '../engine/types';

export const formatDate = (at: ISODate) => formatInTimeZone(at, CONFIG.timezone, 'd MMM yyyy');

export function deadlineLabel(deadline: ISODate, now: Date): { text: string; tone: 'ok' | 'soon' | 'late' } {
  const days = daysUntil(deadline, now);
  if (days < 0) return { text: `${-days}d overdue`, tone: 'late' };
  if (days === 0) return { text: 'Due today', tone: 'soon' };
  if (days <= 7) return { text: `${days}d left`, tone: 'soon' };
  return { text: formatDate(deadline), tone: 'ok' };
}
