import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, createInitialState, migrate } from '../src/engine/migrate';
import { CONFIG } from '../src/engine/config';
import { activeQuest, play } from './helpers';

describe('createInitialState', () => {
  it('starts empty with default settings', () => {
    expect(createInitialState()).toEqual({
      schemaVersion: 1,
      quests: [],
      leadActions: [],
      courageCards: [],
      savePoints: [],
      rewards: [],
      events: [],
      unlockedAchievements: [],
      settings: { timezone: 'Europe/Zurich', weeklyCourageTarget: CONFIG.weeklyCourageTarget },
    });
  });
});

describe('migrate', () => {
  it('passes a current state through unchanged', () => {
    const s = play(activeQuest('q1'));
    expect(migrate(structuredClone(s))).toEqual(s);
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });

  it('rejects non-objects, missing versions and future versions', () => {
    expect(() => migrate(null)).toThrow();
    expect(() => migrate('x')).toThrow();
    expect(() => migrate({})).toThrow(/schemaVersion/);
    expect(() => migrate({ schemaVersion: 99 })).toThrow(/newer/);
  });
});
