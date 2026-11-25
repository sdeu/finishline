import { CONFIG } from './config';
import { eventXp, levelFor, levelProgress, totalXp, xpIntoLevel, xpToNextLevel } from './scoring';
import type { GameState, LeadAction, Quest, WeekKey } from './types';
import { weekKey } from './weeks';

// Derived, read-only views of the state. Never stored.

export const activeQuests = (state: GameState): Quest[] => state.quests.filter((q) => q.status === 'active');
export const vaultQuests = (state: GameState): Quest[] => state.quests.filter((q) => q.status === 'vault');

/** Finished and killed quests, most recently closed first. */
export const closedQuests = (state: GameState): Quest[] =>
  state.quests
    .filter((q) => q.status === 'finished' || q.status === 'killed')
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''));

export const freeSlots = (state: GameState): number => Math.max(0, CONFIG.maxActiveQuests - activeQuests(state).length);
export const slotsFull = (state: GameState): boolean => freeSlots(state) === 0;

export type VaultSort = 'newest' | 'title' | 'deadline';

export function sortVault(quests: Quest[], by: VaultSort): Quest[] {
  const list = [...quests];
  switch (by) {
    case 'newest':
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    case 'deadline':
      return list.sort((a, b) => {
        if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }
}

/** Lead actions of one quest, optionally for one week, in creation order. */
export const leadActionsFor = (state: GameState, questId: string, week?: WeekKey): LeadAction[] =>
  state.leadActions.filter((l) => l.questId === questId && (week === undefined || l.week === week));

/** XP a quest has earned so far (lead actions, boss, kill, drift). */
export function questXp(state: GameState, questId: string): number {
  return state.events
    .filter((e) => 'questId' in e && e.questId === questId)
    .reduce((sum, e) => sum + eventXp(state, e), 0);
}

export interface SlotView {
  quest: Quest;
  leadActions: LeadAction[];
  canAddLeadAction: boolean;
}

export interface Scoreboard {
  xp: number;
  level: number;
  progress: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  week: WeekKey;
  freeSlots: number;
  slots: SlotView[];
}

/** Everything the dashboard shows, in one call. */
export function scoreboard(state: GameState, now: Date): Scoreboard {
  const xp = totalXp(state);
  const week = weekKey(now);
  return {
    xp,
    level: levelFor(xp),
    progress: levelProgress(xp),
    xpIntoLevel: xpIntoLevel(xp),
    xpToNextLevel: xpToNextLevel(xp),
    week,
    freeSlots: freeSlots(state),
    slots: activeQuests(state).map((quest) => {
      const leadActions = leadActionsFor(state, quest.id, week);
      return { quest, leadActions, canAddLeadAction: leadActions.length < CONFIG.maxLeadActionsPerQuestPerWeek };
    }),
  };
}
