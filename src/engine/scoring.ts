import { CONFIG } from './config';
import type { GameEvent, GameState } from './types';

function multiplierFor(state: GameState, questId: string): number {
  const quest = state.quests.find((q) => q.id === questId);
  return quest?.isPublic ? CONFIG.publicMultiplier : 1;
}

/** XP a single event is worth, including the public-commitment multiplier. */
export function eventXp(state: GameState, event: GameEvent): number {
  const { xp } = CONFIG;
  switch (event.type) {
    case 'LEAD_ACTION_DONE':
      return xp.leadActionDone * multiplierFor(state, event.questId);
    case 'BOSS_DEFEATED':
      return xp.bossDefeated * multiplierFor(state, event.questId);
    case 'QUEST_KILLED':
      return xp.questKilled;
    case 'QUEST_DRIFTED':
      return xp.questDrifted;
    case 'COURAGE_LOGGED':
      return xp.courage[event.rarity];
    case 'SAVE_POINT':
      return xp.savePoint;
    case 'OVERRIDE_USED':
    case 'STREAK_RESET':
      return 0;
  }
}

/** Total XP, derived from the event log. Never below 0. */
export function totalXp(state: GameState): number {
  const sum = state.events.reduce((acc, e) => acc + eventXp(state, e), 0);
  return Math.max(0, sum);
}

const clamp = (xp: number) => Math.max(0, xp);

export function levelFor(xp: number): number {
  return Math.floor(clamp(xp) / CONFIG.xpPerLevel) + 1;
}

export function xpIntoLevel(xp: number): number {
  return clamp(xp) % CONFIG.xpPerLevel;
}

export function xpToNextLevel(xp: number): number {
  return CONFIG.xpPerLevel - xpIntoLevel(xp);
}

/** 0 ≤ progress < 1 towards the next level. */
export function levelProgress(xp: number): number {
  return xpIntoLevel(xp) / CONFIG.xpPerLevel;
}
