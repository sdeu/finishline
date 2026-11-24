import type { CourageRarity } from './types';

/** Every tunable number in the game lives here. */
export const CONFIG = {
  maxActiveQuests: 2,
  maxLeadActionsPerQuestPerWeek: 3,
  driftDays: 14,
  xpPerLevel: 300,
  weeklyCourageTarget: 3,
  timezone: 'Europe/Zurich',
  publicMultiplier: 2,
  xp: {
    leadActionDone: 10,
    bossDefeated: 100,
    questKilled: 30,
    questDrifted: -20,
    savePoint: 20,
    courage: { common: 5, rare: 15, epic: 40 } satisfies Record<CourageRarity, number>,
  },
} as const;
