import { describe, expect, it } from 'vitest';
import { isSameLocalDay, weekKey } from '../src/engine/weeks';
import { at } from './helpers';

describe('weekKey (ISO week, Europe/Zurich)', () => {
  it('returns the ISO week', () => {
    expect(weekKey(at('2026-11-24T09:00:00Z'))).toBe('2026-W48');
  });

  it('starts the week on Monday at midnight Zurich time, not UTC', () => {
    // Sunday 29 Nov 23:30 UTC is already Monday 00:30 in Zurich
    expect(weekKey(at('2026-11-29T22:59:00Z'))).toBe('2026-W48');
    expect(weekKey(at('2026-11-29T23:00:00Z'))).toBe('2026-W49');
  });

  it('uses the ISO week-numbering year around new year', () => {
    expect(weekKey(at('2027-01-01T12:00:00Z'))).toBe('2026-W53');
    expect(weekKey(at('2027-01-04T12:00:00Z'))).toBe('2027-W01');
    expect(weekKey(at('2025-12-29T12:00:00Z'))).toBe('2026-W01');
  });

  it('handles summer time (UTC+2)', () => {
    // Sunday 5 Jul 2026 22:00 UTC = Monday 00:00 CEST
    expect(weekKey(at('2026-07-05T21:59:00Z'))).toBe('2026-W27');
    expect(weekKey(at('2026-07-05T22:00:00Z'))).toBe('2026-W28');
  });
});

describe('isSameLocalDay', () => {
  it('compares calendar days in Zurich', () => {
    expect(isSameLocalDay(at('2026-11-24T00:00:00Z'), at('2026-11-24T22:59:00Z'))).toBe(true);
    expect(isSameLocalDay(at('2026-11-24T22:59:00Z'), at('2026-11-24T23:00:00Z'))).toBe(false);
    expect(isSameLocalDay(at('2026-11-23T23:00:00Z'), at('2026-11-24T10:00:00Z'))).toBe(true);
  });
});
