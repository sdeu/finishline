import { CONFIG } from './config';
import type { GameState } from './types';

export const CURRENT_SCHEMA_VERSION = 1;

export function createInitialState(): GameState {
  return {
    schemaVersion: 1,
    quests: [],
    leadActions: [],
    courageCards: [],
    savePoints: [],
    rewards: [],
    events: [],
    unlockedAchievements: [],
    settings: { timezone: CONFIG.timezone, weeklyCourageTarget: CONFIG.weeklyCourageTarget },
  };
}

/**
 * Bring a stored state of any known schema version up to the current one.
 * Add a step per version bump: `if (version === 1) { raw = from1to2(raw); version = 2; }`.
 * Deep validation of imported data is added with zod in Phase 5.
 */
export function migrate(raw: unknown): GameState {
  if (typeof raw !== 'object' || raw === null) throw new Error('Saved game is not an object');
  const version = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version !== 'number') throw new Error('Saved game has no schemaVersion');
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Saved game is from a newer version (${version}) of Finish Line`);
  }
  return raw as GameState;
}
