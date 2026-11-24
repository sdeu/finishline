import { applyAction, type GameAction } from '../src/engine/actions';
import { createInitialState } from '../src/engine/migrate';
import type { GameState } from '../src/engine/types';

/** Tuesday 24 Nov 2026, 10:00 in Zurich (UTC+1). ISO week 2026-W48. */
export const NOW = new Date('2026-11-24T09:00:00Z');

export const at = (iso: string) => new Date(iso);

export function play(actions: GameAction[], now: Date = NOW, start: GameState = createInitialState()) {
  return actions.reduce((s, a) => applyAction(s, a, now), start);
}

export const vaultQuest = (id: string, extra: Partial<Extract<GameAction, { type: 'createQuest' }>> = {}): GameAction => ({
  type: 'createQuest',
  id,
  title: `Quest ${id}`,
  boss: `Boss ${id} is defeated`,
  ...extra,
});

export const activeQuest = (id: string, extra: Partial<Extract<GameAction, { type: 'createQuest' }>> = {}): GameAction[] => [
  vaultQuest(id, extra),
  { type: 'activateQuest', questId: id },
];
